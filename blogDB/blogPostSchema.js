import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema({
  topicColor: {type: String, required: true },
  topicName: { type: String, required: true },
  topicOrder: { type: Number, required: true },
})

const postSchema = new mongoose.Schema({
  postId: { type: Number, required: true, unique: true },
  postTitle: { type: String, required: true },
  postAuthor: { type: String, required: true },
  postDate: { type: String, required: true },
  postContent: { type: String, required: true },
  postTopics: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
  contentType: { type: String, default: 'markdown' } // Default to markdown
});

const blogPost = mongoose.model('Post', postSchema)

export { blogPost }
