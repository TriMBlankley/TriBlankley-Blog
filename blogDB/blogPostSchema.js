import mongoose from 'mongoose'

const postSchema = new mongoose.Schema({
  postId: { type: Number, required: true },
  postDate: { type: Date, required: true },
})
const blogPost = mongoose.model('Post', postSchema)

export { blogPost }
