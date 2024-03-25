const lo = require('lodash')

const dummy = (blogs) => {
    return 1
}

const totalLikes = (blogs) => {
    const reducer = (sum, item) => {
        return sum + item.likes
    }
    return blogs.reduce(reducer, 0)
}

const favoriteBlog = (blogs) => {
    const reducer = (max, item) => {
        return max.likes > item.likes 
            ? {"title": max.title, "author": max.author, "likes": max.likes} 
            : {"title": item.title, "author": item.author, "likes": item.likes}
    }
    return blogs.reduce(reducer, 0)
}

const mostBlogs = (blogs) => {
    const blogCounts = lo.countBy(blogs, 'author')
    const topAuthor = lo.maxBy(Object.keys(blogCounts), (author) => blogCounts[author])
    return {"author": topAuthor, "blogs": blogCounts[topAuthor]}
}

const mostLikes = (blogs) => {
    const authorWorks = lo.groupBy(blogs, 'author')
    const likeCounts = lo.mapValues(authorWorks, (author) => lo.sumBy(author, 'likes'))
    const topAuthor = lo.maxBy(Object.keys(likeCounts), (author) => likeCounts[author])
    return {"author": topAuthor, "likes": likeCounts[topAuthor]}
}

module.exports = {
    dummy,
    totalLikes,
    favoriteBlog,
    mostBlogs,
    mostLikes
}