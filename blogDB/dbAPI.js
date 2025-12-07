// [file name]: dbAPI.js
import express from 'express';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
// Import post Schemas:
import { blogPost, blogTopic, PostGroup } from "./blogPostSchema.js";

// Import backup functions
import { createBackup, listBackups } from './backupUtility.js';

const app = express();
app.use(express.json({ limit: '500mb' }));
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

// ===============================
// PASSWORD MANAGEMENT
// ===============================

// Initialize password collection
const passwordSchema = new mongoose.Schema({
  passwordHash: String,
  sessionTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: Date
  }]
});

const Password = mongoose.model('Password', passwordSchema);

// Initialize default password if not exists
async function initializePassword() {
  const existingPassword = await Password.findOne();
  if (!existingPassword) {
    // Default password: "admin123" - CHANGE THIS IN PRODUCTION!
    const defaultHash = await bcrypt.hash('admin123', 10);
    const passwordDoc = new Password({
      passwordHash: defaultHash,
      sessionTokens: []
    });
    await passwordDoc.save();
    console.log('🔐 Default password initialized (admin123)');
  }
}

// Verify password
async function verifyPassword(inputPassword) {
  try {
    const passwordDoc = await Password.findOne();
    if (!passwordDoc) {
      await initializePassword();
      return false;
    }

    return await bcrypt.compare(inputPassword, passwordDoc.passwordHash);
  } catch (error) {
    console.error('Password verification error:', error);
    return false;
  }
}

// Create session token
async function createSessionToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const passwordDoc = await Password.findOne();

  // Clean up expired tokens
  const now = new Date();
  const validTokens = passwordDoc.sessionTokens.filter(
    session => session.expiresAt > now
  );

  // Add new token (valid for 1 hour)
  validTokens.push({
    token,
    expiresAt: new Date(now.getTime() + 60 * 60 * 1000) // 1 hour
  });

  passwordDoc.sessionTokens = validTokens;
  await passwordDoc.save();

  return token;
}

// Verify session token
async function verifySessionToken(token) {
  try {
    const passwordDoc = await Password.findOne();
    if (!passwordDoc) return false;

    const now = new Date();
    const validSession = passwordDoc.sessionTokens.find(
      session => session.token === token && session.expiresAt > now
    );

    return !!validSession;
  } catch (error) {
    console.error('Session verification error:', error);
    return false;
  }
}

// Enhanced middleware to check authentication
async function requireAuth(req, res, next) {
  // Always allow GET requests (read-only) without authentication
  if (req.method === 'GET') {
    return next();
  }

  // Allow password verification endpoint without token
  if (req.path === '/api/verify-password') {
    return next();
  }

  // Check for session token in headers
  const sessionToken = req.headers['x-session-token'];

  if (!sessionToken) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Session token is missing. Please authenticate first.'
    });
  }

  const isValidToken = await verifySessionToken(sessionToken);

  if (!isValidToken) {
    return res.status(401).json({
      error: 'Invalid or expired session',
      message: 'Your session has expired or is invalid. Please re-authenticate.'
    });
  }

  next();
}

// Apply auth middleware to all routes except health check and password verification
app.use((req, res, next) => {
  if (req.path === '/api/health' || req.path === '/api/verify-password') {
    return next();
  }
  requireAuth(req, res, next);
});

// Initialize password on startup
initializePassword();

// ===============================
// CHANGE TRACKING FOR HOURLY BACKUPS
// ===============================

let lastChangeTimestamp = null;
let lastBackupTimestamp = null;

/**
 * Track when changes are made to the database
 */
function trackChange() {
  lastChangeTimestamp = new Date();
  console.log(`📝 Change detected at: ${lastChangeTimestamp.toISOString()}`);
}

/**
 * Check if changes have been made since the last backup
 */
function hasChangesSinceLastBackup() {
  return lastChangeTimestamp !== null &&
         (lastBackupTimestamp === null || lastChangeTimestamp > lastBackupTimestamp);
}

/**
 * Get time since last change in minutes
 */
function getTimeSinceLastChange() {
  if (!lastChangeTimestamp) return null;
  const now = new Date();
  return Math.round((now - lastChangeTimestamp) / (1000 * 60));
}

/**
 * Get time since last backup in minutes
 */
function getTimeSinceLastBackup() {
  if (!lastBackupTimestamp) return null;
  const now = new Date();
  return Math.round((now - lastBackupTimestamp) / (1000 * 60));
}

/**
 * Create backup and update timestamps
 */
async function createScheduledBackup() {
  try {
    if (hasChangesSinceLastBackup()) {
      console.log('🔄 Changes detected, creating hourly backup...');
      const backupName = `hourly-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      const result = await createBackup(backupName);

      lastBackupTimestamp = new Date();
      lastChangeTimestamp = null; // Reset change tracking after successful backup

      console.log(`✅ Hourly backup completed: ${backupName}`);
      console.log(`📊 Last change: ${getTimeSinceLastBackup()} minutes ago`);

      return result;
    } else {
      console.log('⏰ Hourly check: No changes detected since last backup');
      return { skipped: true, message: 'No changes detected' };
    }
  } catch (error) {
    console.error('⚠️ Hourly backup failed:', error.message);
    throw error;
  }
}

/**
 * Get backup scheduler status
 */
function getSchedulerStatus() {
  return {
    lastChange: lastChangeTimestamp,
    lastBackup: lastBackupTimestamp,
    changesPending: hasChangesSinceLastBackup(),
    minutesSinceLastChange: getTimeSinceLastChange(),
    minutesSinceLastBackup: getTimeSinceLastBackup(),
    nextBackupCheck: 'Every hour on the hour'
  };
}

// Set up hourly backup scheduler
setInterval(async () => {
  console.log('⏰ Running hourly backup check...');
  await createScheduledBackup();
}, 60 * 60 * 1000); // Every hour

// Run immediately on startup (optional)
setTimeout(() => {
  console.log('⏰ Starting hourly backup scheduler...');
  createScheduledBackup();
}, 10000); // Wait 10 seconds after startup

// ===============================
// PASSWORD API ENDPOINTS
// ===============================

app.post('/api/verify-password', async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const isValid = await verifyPassword(password);

    if (isValid) {
      const sessionToken = await createSessionToken();
      res.json({
        valid: true,
        sessionToken: sessionToken,
        expiresIn: 3600 // 1 hour in seconds
      });
    } else {
      res.json({ valid: false });
    }
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/change-password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current and new password are required' });
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update to new password
    const newHash = await bcrypt.hash(newPassword, 10);
    const passwordDoc = await Password.findOne();
    passwordDoc.passwordHash = newHash;
    // Clear all existing sessions when password changes
    passwordDoc.sessionTokens = [];
    await passwordDoc.save();

    trackChange(); // Track password change
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===============================
// BACKUP API ENDPOINTS
// ===============================

app.post('/api/backup', async (req, res) => {
  try {
    const { backupName } = req.body;
    const result = await createBackup(backupName);
    // Update backup timestamp for manual backups too
    lastBackupTimestamp = new Date();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backups', async (req, res) => {
  try {
    const backups = listBackups();
    res.json(backups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backup/status', (req, res) => {
  res.json(getSchedulerStatus());
});

// ===============================
// HEALTH CHECK
// ===============================

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    backupStatus: getSchedulerStatus()
  });
});

// ===============================
// POST GROUPS API
// ===============================

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
    trackChange(); // Track that a change was made
    res.status(201).json(savedGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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
      throw new Error('Post group not found');
    }

    // Update group color in all associated posts
    await blogPost.updateMany(
      { 'postGroup.groupId': req.params.id },
      {
        'postGroup.groupName': updatedGroup.groupName,
        'postGroup.groupColor': updatedGroup.groupColor
      }
    );

    trackChange(); // Track that a change was made
    res.json(updatedGroup);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

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
      throw new Error('Post group not found');
    }

    trackChange(); // Track that a change was made
    res.json({ message: 'Post group deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===============================
// TOPICS API
// ===============================

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
    trackChange(); // Track that a change was made
    res.json(newTopics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// POSTS API
// ===============================

app.get('/api/posts', async (req, res) => {
  try {
    const posts = await blogPost.find().sort({ postId: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

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

    const postData = {
      ...req.body,
      postId: newPostId,
      postDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    };

    // Validate and ensure postAuthor is an array
    if (postData.postAuthor && !Array.isArray(postData.postAuthor)) {
      if (typeof postData.postAuthor === 'string') {
        postData.postAuthor = [postData.postAuthor];
      } else {
        postData.postAuthor = [];
      }
    }

    const newPost = new blogPost(postData);
    const savedPost = await newPost.save();
    trackChange(); // Track that a change was made
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
    trackChange(); // Track that a change was made
    res.json(updatedPost);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/posts/:id', async (req, res) => {
  try {
    await blogPost.findOneAndDelete({ postId: parseInt(req.params.id) });
    trackChange(); // Track that a change was made
    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ===============================
// FILE UPLOAD API
// ===============================

app.post('/api/upload/:postId', async (req, res) => {
  try {
    const { postId } = req.params;
    const { filename, base64Data, fileType = 'attachment', sequence, attachmentType = 'image' } = req.body;

    // Validate post exists
    const post = await blogPost.findOne({ postId: parseInt(postId) });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const buffer = Buffer.from(base64Data, 'base64');

    const result = await new Promise((resolve, reject) => {
      const uploadStream = gfs.openUploadStream(filename);

      uploadStream.end(buffer);

      uploadStream.on('finish', async (file) => {
        try {
          const fileData = {
            filename: filename,
            fileId: uploadStream.id,
            fileType: fileType,
            uploadDate: new Date(),
            attachmentType: attachmentType
          };

          if (sequence !== undefined) {
            fileData.sequence = sequence;
          }

          // Add file reference to post
          await blogPost.findOneAndUpdate(
            { postId: parseInt(postId) },
            {
              $push: {
                attachedFiles: fileData
              }
            }
          );

          trackChange(); // Track that a change was made
          resolve({
            message: 'File uploaded successfully',
            fileId: uploadStream.id,
            filename: filename,
            attachmentType: attachmentType
          });
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

    res.json(result);
  } catch (err) {
    console.error('Upload endpoint error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ===============================
// FILE DOWNLOAD API (Read-only, no auth required)
// ===============================

app.get('/api/file/:fileId', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);
    const filesCollection = conn.db.collection('uploads.files');
    const fileDoc = await filesCollection.findOne({ _id: fileId });

    if (!fileDoc) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.setHeader('Content-Type', fileDoc.contentType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileDoc.filename)}"`);
    res.setHeader('Content-Length', fileDoc.length);
    res.setHeader('Accept-Ranges', 'bytes');

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

// ===============================
// ERROR HANDLING
// ===============================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(8050, () => {
  console.log('Server running on http://localhost:8050');
  console.log('⏰ Hourly backup system: ACTIVE (only when changes detected)');
  console.log('🔐 Password protection: ENABLED');
  console.log('Default password: admin123');
  console.log('\n📊 Backup Strategy:');
  console.log('  - Manual backups via POST /api/backup');
  console.log('  - Automatic backups every hour IF changes detected');
  console.log('  - Check status via GET /api/backup/status');
  console.log('  - List backups via GET /api/backups');
});
