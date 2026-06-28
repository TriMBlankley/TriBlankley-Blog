// [file name]: blogSchema.ts
import mongoose from 'mongoose'

const blogTopicSchema = new mongoose.Schema({
  topicColor: {type: String, required: true },
  topicName: { type: String, required: true },
  topicOrder: { type: Number, required: true },
})

interface topicType {
  topicColor: string;
  topicName: string;
  topicOrder: number;
}

const postGroupSchema = new mongoose.Schema({
  groupName: { type: String, required: true, unique: true },
  groupDescription: { type: String, default: '' },
  groupColor: { type: String, default: '#007bff' },
  createdDate: { type: Date, default: Date.now },
  updatedDate: { type: Date, default: Date.now }
});

interface groupType{
  groupName: string;
  groupDescription: string;
  groupColor: string;
  createdDate: Date;
  updatedDate: Date;
}

const blogPostSchema = new mongoose.Schema({
  postId: { type: Number, required: true, unique: true },
  postTitle: { type: String, required: true },
  postAuthor: { type: [String], required: true }, // FIXED: Now properly defined as array of strings
  postDate: { type: String, required: true },
  postContent: { type: String, required: true },
  contentType: { type: String, default: 'Text' },
  isNSFW: { type: Boolean, default: false },
  postTopics: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
  showGalleryView: { type: Boolean, default: false }, // NEW: Gallery view flag
  postGroup: {
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'PostGroup' },
    groupName: { type: String },
    groupColor: { type: String },
    sequence: { type: Number, default: 0 }
  },
  attachedFiles: [{
    filename: String,
    fileId: mongoose.Types.ObjectId,
    uploadDate: { type: Date, default: Date.now },
    fileType: { type: String, enum: ['in-text', 'attachment'], default: 'attachment' },
    attachmentType: { type: String, enum: ['image', 'audio', 'video'], default: 'image' }, // NEW: Type for sequenced attachments
    sequence: { type: Number, default: undefined }
  }]
});

interface postType{
  postId: number;
  postTitle: string;
  postAuthor: string; // FIXED: Now properly defined as array of strings
  postDate: string;
  postContent: string;
  contentType: string;
  isNSFW: boolean;
  postTopics: string;
  isPublished: boolean;
  showGalleryView: boolean; // NEW: Gallery view flag
  postGroup: {
    groupId: mongoose.Schema.Types.ObjectId;
    groupName: string;
    groupColor: string;
    sequence: number;
  };
  attachedFiles: {
    filename: string;
    fileId: mongoose.Types.ObjectId;
    uploadDate: Date;
    fileType: 'in-text' | 'attachment';
    attachmentType: 'image' | 'audio' | 'video'; 
    sequence: number;
  };
}

const blogTopic = mongoose.model('Topic', blogTopicSchema)
const blogPost = mongoose.model('Post', blogPostSchema)
const PostGroup = mongoose.model('PostGroup', postGroupSchema)

export type { postType, topicType, groupType }
export { blogTopic, blogPost, PostGroup }