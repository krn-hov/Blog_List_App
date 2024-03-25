const { test, after, beforeEach } = require('node:test')
const Blog = require('../models/blog')
const User = require('../models/user')
const mongoose = require('mongoose')
const supertest = require('supertest')
const assert = require('node:assert')
const app = require('../app')
const api = supertest(app)
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

const helper = require('./test_helper')

beforeEach(async () => {
    await Blog.deleteMany({})
    let blogObject = new Blog(helper.initialBlogs[0])
    await blogObject.save()
    blogObject = new Blog(helper.initialBlogs[1])
    await blogObject.save()

    await User.deleteMany({})
    const passwordHash = await bcrypt.hash('sekret', 10)
    const user = new User({ username: 'krnhov', passwordHash})

    await user.save()
})

test('blogs are returned as json', async () => {
  await api
    .get('/api/blogs')
    .expect(200)
    .expect('Content-Type', /application\/json/)
})

after(async () => {
  await mongoose.connection.close()
})

test('there are two blogs', async () => {
  const response = await api.get('/api/blogs')

  assert(response.body.length,2)
})

test('blog contains id', async () => {
  const response = await api.get('/api/blogs')
  assert(response.body[0].id,/\w+/)
})

test('a valid blog can be added', async () => {
    const newBlog = {
        title: "React sequences",
        author: "Michael Ban",
        url: "https://reactsequences.com/",
        likes: 6,
        __v: 0
    }
    const login = await api.post('/api/login').send({ username: 'krnhov', password: 'sekret' })
    const token = login.body.token.toString()
    
    
    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    const response = await api.get('/api/blogs')
    const titles = response.body.map(r => r.title)
    assert.strictEqual(response.body.length, helper.initialBlogs.length + 1)

    assert(titles.includes('React sequences'))
})

test('likes default to 0', async () => {
    const newBlog = {
        title: "AI in the future",
        author: "albert",
        url: "https://ai.com/"
    }
    const login = await api.post('/api/login').send({ username: 'krnhov', password: 'sekret' })
    const token = login.body.token.toString()

    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `Bearer ${token}`)
        .expect(201)
        .expect('Content-Type', /application\/json/)
    const response = await api.get('/api/blogs')
    const likes = response.body.map(r => r.likes)
    assert.strictEqual(likes[likes.length - 1],0)
})

test('blog without title returns status code 400', async () => {
    const newBlog = {
        author: "albert",
        url: "https://ai.com/"
    }

    const login = await api.post('/api/login').send({ username: 'krnhov', password: 'sekret' })
    const token = login.body.token.toString()

    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
})

test('blog without url returns status code 400', async () => {
    const newBlog = {
        title: "AI in the future",
        author: "albert",
    }
    const login = await api.post('/api/login').send({ username: 'krnhov', password: 'sekret' })
    const token = login.body.token.toString()

    await api
        .post('/api/blogs')
        .send(newBlog)
        .set('Authorization', `Bearer ${token}`)
        .expect(400)
})

test('blog can be deleted with 204 status code', async () => {
    const response = await api.get('/api/blogs')
    const id = response.body[0].id
    await api
        .delete(`/api/blogs/${id}`)
        .expect(204)
    const newResponse = await api.get('/api/blogs')
    assert.strictEqual(newResponse.body.length,1)
})

test('blog can be updated with status code 200', async () => {
    const response = await api.get('/api/blogs')
    const id = response.body[0].id
    const newBlog = {
        title: "AI in the future",
        author: "albert",
        url: "https://ai.com/",
        likes: 10
    }
    await api
        .put(`/api/blogs/${id}`)
        .send(newBlog)
        .expect(200)
})

test('blog fails without proper token with 401', async () => {
    const newBlog = {
        title: "AI in the past",
        author: "Freddy",
        url: "https://ai.com/",
    }


    await api
        .post('/api/blogs')
        .send(newBlog)
        .expect(401)
    
})