import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema({
  topicColor: {type: String, required: true },
  topicName: { type: String, required: true },
  topicOrder: { type: Number, required: true },
})

const postSchema = new mongoose.Schema({
  postId: { type: Number, required: true },
  postDate: { type: Date, required: true },
})
const blogPost = mongoose.model('Post', postSchema)

export { blogPost }
