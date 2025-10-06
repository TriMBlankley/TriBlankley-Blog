// [file name]: enhancedDbAPI.js
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { GridFSBucket } from 'mongodb';
import fs from 'fs';
import path from 'path';
// Import post Schemas:
import { blogPost, blogTopic } from "./blogPostSchema.js";

const app = express();
app.use(express.json({ limit: '50mb' }));

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
    const posts = await blogPost.find(); // Changed from Post to blogPost
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
    const highestPost = await blogPost.findOne().sort('-postId'); // Changed from Post to blogPost
    const newPostId = highestPost ? highestPost.postId + 1 : 1;

    const newPost = new blogPost({ // Changed from Post to blogPost
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

// File Upload endpoint -------------------------------------------------------------------
app.post('/api/upload/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { filename, base64Data } = req.body;

    const buffer = Buffer.from(base64Data, 'base64');

    return new Promise((resolve, reject) => {
      const uploadStream = gfs.openUploadStream(filename);

      uploadStream.end(buffer);

      uploadStream.on('finish', async (file) => {
        try {
          // Add file reference to post
          await blogPost.findOneAndUpdate(
            { postId: postId },
            {
              $push: {
                attachedFiles: {
                  filename: filename,
                  fileId: uploadStream.id // Use uploadStream.id instead of file._id
                }
              }
            }
          );

          res.json({
            message: 'File uploaded successfully',
            fileId: uploadStream.id
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      });

      uploadStream.on('error', (error) => {
        reject(error);
      });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// File Download Endpoint ---------------------------------------------------------
app.get('/api/file/:fileId', (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const downloadStream = gfs.openDownloadStream(fileId);

    downloadStream.on('data', (chunk) => {
      res.write(chunk);
    });

    downloadStream.on('end', () => {
      res.end();
    });

    downloadStream.on('error', (err) => {
      res.status(404).json({ error: 'File not found' });
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


app.listen(8050, () => {
  console.log('Server running on http://localhost:8050');
});
