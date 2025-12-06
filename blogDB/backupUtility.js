// [file name]: backupUtility.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { blogPost, blogTopic, PostGroup } from './blogPostSchema.js';
import archiver from 'archiver';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/blogDB')
.then(() => {
  console.log('✅ Connected to MongoDB for backup');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err);
  process.exit(1);
});

const conn = mongoose.connection;
let gfs;

conn.once('open', () => {
  gfs = new GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
  
  console.log('📦 GridFS bucket initialized');
});

/**
 * Create a comprehensive backup of the blog system
 * @param {string} backupName - Optional custom backup name
 */
export async function createBackup(backupName = null) {
  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = backupName || `backup-${timestamp}`;
    const backupDir = path.join(__dirname, 'backups', backupId);
    const backupFilePath = path.join(__dirname, 'backups', `${backupId}.zip`);
    
    // Create backup directory
    fs.mkdirSync(backupDir, { recursive: true });
    fs.mkdirSync(path.join(backupDir, 'files'), { recursive: true });
    
    console.log(`🚀 Starting backup: ${backupId}`);
    
    // 1. Backup all collections data
    console.log('📊 Backing up database collections...');
    const collections = await backupCollections(backupDir);
    
    // 2. Backup all GridFS files
    console.log('📎 Backing up GridFS files...');
    const files = await backupGridFSFiles(backupDir);
    
    // 3. Create manifest file
    console.log('📝 Creating backup manifest...');
    await createManifest(backupDir, collections, files);
    
    // 4. Create zip archive
    console.log('🗜️ Creating zip archive...');
    await createZipArchive(backupDir, backupFilePath);
    
    // 5. Clean up temporary directory
    fs.rmSync(backupDir, { recursive: true, force: true });
    
    console.log(`✅ Backup completed: ${backupFilePath}`);
    console.log(`📊 Summary:`);
    console.log(`   Posts: ${collections.posts.length}`);
    console.log(`   Topics: ${collections.topics.length}`);
    console.log(`   Post Groups: ${collections.postGroups.length}`);
    console.log(`   Files: ${files.length}`);
    
    return {
      backupId,
      backupPath: backupFilePath,
      stats: {
        posts: collections.posts.length,
        topics: collections.topics.length,
        postGroups: collections.postGroups.length,
        files: files.length,
        totalSize: getFileSize(backupFilePath)
      }
    };
    
  } catch (error) {
    console.error('❌ Backup failed:', error);
    throw error;
  }
}

/**
 * Backup all collections to JSON files
 */
async function backupCollections(backupDir) {
  const [posts, topics, postGroups] = await Promise.all([
    blogPost.find({}),
    blogTopic.find({}),
    PostGroup.find({})
  ]);
  
  // Convert Mongoose documents to plain objects
  const postsData = posts.map(post => post.toObject());
  const topicsData = topics.map(topic => topic.toObject());
  const postGroupsData = postGroups.map(group => group.toObject());
  
  // Save collections to JSON files
  fs.writeFileSync(
    path.join(backupDir, 'posts.json'),
    JSON.stringify(postsData, null, 2)
  );
  
  fs.writeFileSync(
    path.join(backupDir, 'topics.json'),
    JSON.stringify(topicsData, null, 2)
  );
  
  fs.writeFileSync(
    path.join(backupDir, 'postGroups.json'),
    JSON.stringify(postGroupsData, null, 2)
  );
  
  return {
    posts: postsData,
    topics: topicsData,
    postGroups: postGroupsData
  };
}

/**
 * Backup all GridFS files
 */
async function backupGridFSFiles(backupDir) {
  const filesDir = path.join(backupDir, 'files');
  const filesCollection = conn.db.collection('uploads.files');
  const files = await filesCollection.find({}).toArray();
  
  const backedUpFiles = [];
  
  for (const file of files) {
    const filePath = path.join(filesDir, file._id.toString());
    
    // Download file from GridFS
    await new Promise((resolve, reject) => {
      const downloadStream = gfs.openDownloadStream(file._id);
      const writeStream = fs.createWriteStream(filePath);
      
      downloadStream.pipe(writeStream);
      
      writeStream.on('finish', () => {
        // Save file metadata
        const metadata = {
          _id: file._id.toString(),
          filename: file.filename,
          contentType: file.contentType,
          length: file.length,
          uploadDate: file.uploadDate,
          metadata: file.metadata || {}
        };
        
        fs.writeFileSync(
          `${filePath}.meta.json`,
          JSON.stringify(metadata, null, 2)
        );
        
        backedUpFiles.push({
          _id: file._id,
          filename: file.filename,
          filePath: path.relative(backupDir, filePath),
          size: file.length
        });
        
        resolve();
      });
      
      writeStream.on('error', reject);
      downloadStream.on('error', reject);
    });
  }
  
  return backedUpFiles;
}

/**
 * Create backup manifest
 */
async function createManifest(backupDir, collections, files) {
  const manifest = {
    backupDate: new Date().toISOString(),
    version: '1.0',
    database: 'blogDB',
    collections: {
      posts: collections.posts.length,
      topics: collections.topics.length,
      postGroups: collections.postGroups.length
    },
    files: files.length,
    totalFileSize: files.reduce((sum, file) => sum + file.size, 0),
    filesList: files.map(file => ({
      id: file._id.toString(),
      filename: file.filename,
      size: file.size
    }))
  };
  
  fs.writeFileSync(
    path.join(backupDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );
  
  return manifest;
}

/**
 * Create zip archive of backup
 */
function createZipArchive(sourceDir, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    output.on('close', () => {
      resolve();
    });
    
    archive.on('error', (err) => {
      reject(err);
    });
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

/**
 * Get file size in human readable format
 */
function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

/**
 * List all available backups
 */
export function listBackups() {
  const backupsDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    return [];
  }
  
  return fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.zip'))
    .map(file => {
      const filePath = path.join(backupsDir, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        path: filePath,
        size: getFileSize(filePath),
        created: stats.birthtime,
        modified: stats.mtime
      };
    })
    .sort((a, b) => b.modified - a.modified);
}

/**
 * Delete a backup file
 */
export function deleteBackup(backupName) {
  const backupsDir = path.join(__dirname, 'backups');
  const backupPath = path.join(backupsDir, backupName);
  
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
    console.log(`🗑️ Deleted backup: ${backupName}`);
    return true;
  }
  
  console.log(`❌ Backup not found: ${backupName}`);
  return false;
}

/**
 * Initialize backup directory structure
 */
function initializeBackupDirectory() {
  const backupsDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
    console.log(`📁 Created backup directory: ${backupsDir}`);
  }
  
  return backupsDir;
}

/**
 * Main backup function to be called from your API endpoints
 * Example usage in your dbAPI.js:
 * 
 * // Import at top of file:
 * import { createBackup } from './backupUtility.js';
 * 
 * // Add endpoint for manual backup:
 * app.post('/api/backup', async (req, res) => {
 *   try {
 *     const result = await createBackup();
 *     res.json(result);
 *   } catch (err) {
 *     res.status(500).json({ error: err.message });
 *   }
 * });
 * 
 * // Add automatic backup trigger after critical operations:
 * async function performCriticalOperation() {
 *   // Your operation code...
 *   
 *   // Trigger backup after operation
 *   try {
 *     await createBackup();
 *   } catch (error) {
 *     console.error('Backup failed, but operation completed:', error);
 *   }
 * }
 */
export default {
  createBackup,
  listBackups,
  deleteBackup
};

// If run directly, create a backup
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeBackupDirectory();
  
  if (process.argv[2] === 'list') {
    const backups = listBackups();
    console.log('📋 Available Backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup.name} (${backup.size}) - ${backup.modified.toLocaleString()}`);
    });
  } else if (process.argv[2] === 'delete' && process.argv[3]) {
    deleteBackup(process.argv[3]);
  } else {
    const backupName = process.argv[2] || null;
    createBackup(backupName)
      .then(result => {
        console.log('🎉 Backup completed successfully!');
        console.log(`📁 Location: ${result.backupPath}`);
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Backup failed:', error);
        process.exit(1);
      });
  }
}