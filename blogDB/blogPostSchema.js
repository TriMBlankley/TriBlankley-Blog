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
  contentType: { type: String, default: 'markdown' }, // Default to markdown
  postTopics: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
  attachedFiles: [{
    filename: String,
    fileId: mongoose.Types.ObjectId,
    uploadDate: { type: Date, default: Date.now }
  }]
});

const blogTopic = mongoose.model('Topic', topicSchema)
const blogPost = mongoose.model('Post', postSchema)

export { blogTopic, blogPost }
