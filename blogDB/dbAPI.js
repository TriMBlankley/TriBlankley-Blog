// [file name]: enhancedDbAPI.js
import express from 'express';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import fs from 'fs';
import path from 'path';
// Import post Schemas:
import { blogPost, blogTopic, PostGroup } from "./blogPostSchema.js";

const app = express();
app.use(express.json({ limit: '500mb' })); // Increase from 500mb to 100mb
app.use(express.urlencoded({ limit: '500mb', extended: true }));


// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blogDB')
.then(() => {
  console.log('✅ Connected to MongoDB');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
});

let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Post Groups API ------------------------------------------------------------------------
app.get('/api/post-groups', async (req, res) => {
  try {
    const groups = await PostGroup.find().sort({ createdDate: -1 });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/post-groups', async (req, res) => {
  try {
    const { groupName, groupDescription } = req.body;

    // Check if group already exists
    const existingGroup = await PostGroup.findOne({ groupName });
    if (existingGroup) {
      return res.status(400).json({ error: 'Post group with this name already exists' });
    }

    const newGroup = new PostGroup({
      groupName,
      groupDescription
    });

    const savedGroup = await newGroup.save();
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get posts by group
app.get('/api/posts/group/:groupId', async (req, res) => {
  try {
    const posts = await blogPost.find({
      'postGroup.groupId': req.params.groupId
    }).sort({ 'postGroup.sequence': 1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update post sequence in group
app.put('/api/posts/:id/sequence', async (req, res) => {
  try {
    const { sequence } = req.body;
    const updatedPost = await blogPost.findOneAndUpdate(
      { postId: parseInt(req.params.id) },
      { 'postGroup.sequence': sequence },
      { new: true }
    );
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Add to the existing Post Groups API section in dbAPI.js

// Update post group
app.put('/api/post-groups/:id', async (req, res) => {
  try {
    const { groupName, groupDescription, groupColor } = req.body;

    // Check if group name already exists (excluding current group)
    if (groupName) {
      const existingGroup = await PostGroup.findOne({
        groupName,
        _id: { $ne: req.params.id }
      });
      if (existingGroup) {
        return res.status(400).json({ error: 'Post group with this name already exists' });
      }
    }

    const updatedGroup = await PostGroup.findByIdAndUpdate(
      req.params.id,
      {
        ...(groupName && { groupName }),
        ...(groupDescription !== undefined && { groupDescription }),
        ...(groupColor && { groupColor }),
        updatedDate: new Date()
      },
      { new: true }
    );

    if (!updatedGroup) {
      return res.status(404).json({ error: 'Post group not found' });
    }

    // Update group color in all associated posts
    await blogPost.updateMany(
      { 'postGroup.groupId': req.params.id },
      {
        'postGroup.groupName': updatedGroup.groupName,
        'postGroup.groupColor': updatedGroup.groupColor
      }
    );

    res.json(updatedGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete post group
app.delete('/api/post-groups/:id', async (req, res) => {
  try {
    // Remove group reference from all posts
    await blogPost.updateMany(
      { 'postGroup.groupId': req.params.id },
      { $unset: { postGroup: 1 } }
    );

    // Delete the group
    const deletedGroup = await PostGroup.findByIdAndDelete(req.params.id);

    if (!deletedGroup) {
      return res.status(404).json({ error: 'Post group not found' });
    }

    res.json({ message: 'Post group deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get single post group
app.get('/api/post-groups/:id', async (req, res) => {
  try {
    const group = await PostGroup.findById(req.params.id);
    if (!group) {
      return res.status(404).json({ error: 'Post group not found' });
    }
    res.json(group);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Topics API ------------------------------------------------------------------------
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await blogTopic.find().sort({ topicOrder: 1 });
    res.json(topics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/topics', async (req, res) => {
  try {
    await blogTopic.deleteMany({});
    const newTopics = await blogTopic.insertMany(req.body);
    res.json(newTopics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Posts API ---------------------------------------------------------------------------
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await blogPost.find().sort({ postId: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const post = await blogPost.findOne({ postId: parseInt(req.params.id) });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/posts', async (req, res) => {
  try {
    // Generate a new postId by finding the highest existing one and adding 1
    const highestPost = await blogPost.findOne().sort('-postId');
    const newPostId = highestPost ? highestPost.postId + 1 : 1;

    const newPost = new blogPost({
      ...req.body,
      postId: newPostId,
      postDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    });

    const savedPost = await newPost.save();
    res.status(201).json(savedPost);
  } catch (err) {
    console.error('Error creating post:', err);
    res.status(400).json({ error: err.message });
  }
});

app.put('/api/posts/:id', async (req, res) => {
  try {
    const updatedPost = await blogPost.findOneAndUpdate(
      { postId: parseInt(req.params.id) },
      req.body,
      { new: true }
    );
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await blogPost.findOneAndDelete({ postId: parseInt(req.params.id) });
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Enhanced File Upload endpoint with sequencing -------------------------------------
// In dbAPI.js - Update the upload endpoint
app.post('/api/upload/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { filename, base64Data, fileType = 'attachment', sequence } = req.body; // Remove default value

    // Validate post exists
    const post = await blogPost.findOne({ postId: parseInt(postId) });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    return new Promise((resolve, reject) => {
      const uploadStream = gfs.openUploadStream(filename);

      uploadStream.end(buffer);

      uploadStream.on('finish', async (file) => {
        try {
          // Create the file object without setting sequence if it's undefined
          const fileData = {
            filename: filename,
            fileId: uploadStream.id,
            fileType: fileType,
            uploadDate: new Date()
          };

          // Only add sequence if it's defined (not undefined)
          if (sequence !== undefined) {
            fileData.sequence = sequence;
          }

          // Add file reference to post with file type and sequence
          await blogPost.findOneAndUpdate(
            { postId: parseInt(postId) },
            {
              $push: {
                attachedFiles: fileData
              }
            }
          );

          res.json({
            message: 'File uploaded successfully',
            fileId: uploadStream.id,
            filename: filename
          });
          resolve();
        } catch (error) {
          console.error('Error updating post with file:', error);
          reject(error);
        }
      });

      uploadStream.on('error', (error) => {
        console.error('Upload stream error:', error);
        reject(error);
      });
    });

  } catch (err) {
    console.error('Upload endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// File Download Endpoint ---------------------------------------------------------
app.get('/api/file/:fileId', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    // First, get file metadata to determine the size
    const filesCollection = conn.db.collection('uploads.files');
    const fileDoc = await filesCollection.findOne({ _id: fileId });

    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Set proper headers for file download
    res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileDoc.filename)}"`);
    res.setHeader('Content-Length', fileDoc.length);
    res.setHeader('Accept-Ranges', 'bytes');

    // Handle range requests for partial content (optional but good for large files)
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileDoc.length - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${fileDoc.length}`,
        'Content-Length': chunksize,
      });

      const downloadStream = gfs.openDownloadStream(fileId, { start, end });
      downloadStream.pipe(res);

      downloadStream.on('error', (err) => {
        console.error('Download stream error:', err);
        if (!res.headersSent) {
          res.status(404).json({ error: 'File not found' });
        }
      });

    } else {
      // Standard full file download
      const downloadStream = gfs.openDownloadStream(fileId);

      downloadStream.pipe(res);

      downloadStream.on('error', (err) => {
        console.error('Download stream error:', err);
        if (!res.headersSent) {
          res.status(404).json({ error: 'File not found' });
        }
      });
    }

  } catch (err) {
    console.error('File download error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(8050, () => {
  console.log('Server running on http://localhost:8050');
});
