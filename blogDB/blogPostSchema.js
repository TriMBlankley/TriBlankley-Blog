// [file name]: blogPostSchema.js
import mongoose from 'mongoose'

const topicSchema = new mongoose.Schema({
  topicColor: {type: String, required: true },
  topicName: { type: String, required: true },
  topicOrder: { type: Number, required: true },
})

const postGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true, unique: true },
  groupDescription: { type: String, default: '' },
  groupColor: { type: String, default: '#007bff' }, // Added group color field
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now }
});

const postSchema = new mongoose.Schema({
  postId: { type: Number, required: true, unique: true },
  postTitle: { type: String, required: true },
  postAuthor: { type: String, required: true },
  postDate: { type: String, required: true },
  postContent: { type: String, required: true },
  contentType: { type: String, default: 'Text' },
  postTopics: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
  postGroup: {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'PostGroup' },
    groupName: { type: String },
    groupColor: { type: String }, // Added group color to post reference
    sequence: { type: Number, default: 0 } // Order within the group
  },
  attachedFiles: [{
    filename: String,
    fileId: mongoose.Types.ObjectId,
    uploadDate: { type: Date, default: Date.now },
    fileType: { type: String, enum: ['image', 'attachment'], default: 'attachment' },
    sequence: { type: Number, default: undefined } // Remove default value to allow undefined
  }]
});

const blogTopic = mongoose.model('Topic', topicSchema)
const blogPost = mongoose.model('Post', postSchema)
const PostGroup = mongoose.model('PostGroup', postGroupSchema)

export { blogTopic, blogPost, PostGroup }
