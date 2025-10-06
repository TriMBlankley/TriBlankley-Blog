// [file name]: restoreUtility.js
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

// Define Mongoose Schemas (same as in your dbAPI.js)
const topicSchema = new mongoose.Schema({
  topicName: { type: String, required: true },
  topicColor: { type: String, required: true },
  topicOrder: { type: Number, required: true },
});

const postSchema = new mongoose.Schema({
  postId: { type: Number, required: true, unique: true },
  postTitle: { type: String, required: true },
  postAuthor: { type: String, required: true },
  postDate: { type: String, required: true },
  postContent: { type: String, required: true },
  postTopics: { type: [String], default: [] },
  isPublished: { type: Boolean, default: false },
  attachedFiles: [{
    filename: String,
    fileId: mongoose.Types.ObjectId,
    uploadDate: { type: Date, default: Date.now }
  }]
});

class BlogrestoreUtility {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
  }

  // List available backups
  listBackups() {
    if (!fs.existsSync(this.backupDir)) {
      console.log('No backups directory found');
      return [];
    }

    const backups = fs.readdirSync(this.backupDir)
      .filter(file => {
        const fullPath = path.join(this.backupDir, file);
        return file.endsWith('.tar.gz') || fs.statSync(fullPath).isDirectory();
      })
      .sort()
      .reverse();

    console.log('Available backups:');
    backups.forEach((backup, index) => {
      const fullPath = path.join(this.backupDir, backup);
      const stats = fs.statSync(fullPath);
      console.log(`${index + 1}. ${backup} (${this.formatFileSize(stats.size)})`);
    });

    return backups;
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Extract compressed backup
  async extractBackup(backupPath, extractPath) {
    try {
      const command = `tar -xzf "${backupPath}" -C "${extractPath}"`;
      await execAsync(command);
      console.log(`Backup extracted to: ${extractPath}`);

      // Find the actual extracted directory
      const items = fs.readdirSync(extractPath);
      const extractedDir = items.find(item =>
        fs.statSync(path.join(extractPath, item)).isDirectory()
      );

      return path.join(extractPath, extractedDir || '');
    } catch (error) {
      throw new Error(`Extraction failed: ${error.message}`);
    }
  }

  // Restore MongoDB database from dump
  async restoreMongoDB(backupPath) {
    try {
      let actualBackupPath = backupPath;

      // Handle compressed backups
      if (backupPath.endsWith('.tar.gz')) {
        const extractPath = path.join(__dirname, 'temp_restore');
        if (fs.existsSync(extractPath)) {
          fs.rmSync(extractPath, { recursive: true, force: true });
        }
        fs.mkdirSync(extractPath, { recursive: true });

        actualBackupPath = await this.extractBackup(backupPath, extractPath);
      }

      // Check if blogDB directory exists in the backup
      const blogDBPath = path.join(actualBackupPath, 'blogDB');
      if (!fs.existsSync(blogDBPath)) {
        throw new Error('blogDB directory not found in backup');
      }

      const command = `mongorestore --db blogDB --drop "${blogDBPath}"`;

      console.log('Restoring MongoDB database...');
      const { stdout, stderr } = await execAsync(command);

      console.log('MongoDB restore completed successfully');

      // Clean up temporary extraction
      if (backupPath.endsWith('.tar.gz')) {
        fs.rmSync(path.dirname(actualBackupPath), { recursive: true, force: true });
      }

      return true;
    } catch (error) {
      throw new Error(`MongoDB restore failed: ${error.message}`);
    }
  }

  // Restore from JSON export (FIXED VERSION)
  async restoreFromJSON(jsonBackupPath) {
    let mongooseConnection = null;

    try {
      // Connect to MongoDB without deprecated options
      mongooseConnection = await mongoose.connect('mongodb://localhost:27017/blogDB');
      console.log('Connected to MongoDB');

      // Register models
      const Post = mongoose.model('Post', postSchema);
      const Topic = mongoose.model('Topic', topicSchema);

      // Read and parse JSON files
      const postsFilePath = path.join(jsonBackupPath, 'posts.json');
      const topicsFilePath = path.join(jsonBackupPath, 'topics.json');

      if (!fs.existsSync(postsFilePath)) {
        throw new Error('posts.json not found in backup');
      }

      const postsData = JSON.parse(fs.readFileSync(postsFilePath, 'utf8'));
      const topicsData = fs.existsSync(topicsFilePath)
        ? JSON.parse(fs.readFileSync(topicsFilePath, 'utf8'))
        : [];

      console.log(`Found ${postsData.length} posts and ${topicsData.length} topics to restore`);

      // Clear existing data
      console.log('Clearing existing data...');
      await Post.deleteMany({});
      await Topic.deleteMany({});

      // Restore data with error handling
      if (topicsData.length > 0) {
        console.log('Restoring topics...');
        await Topic.insertMany(topicsData);
      }

      console.log('Restoring posts...');
      await Post.insertMany(postsData);

      console.log(`JSON restore completed: ${postsData.length} posts, ${topicsData.length} topics`);
      return true;
    } catch (error) {
      throw new Error(`JSON restore failed: ${error.message}`);
    } finally {
      if (mongooseConnection) {
        await mongooseConnection.connection.close();
      }
    }
  }

  // Restore GridFS files
  async restoreGridFSFiles(filesBackupPath) {
    let mongooseConnection = null;

    try {
      mongooseConnection = await mongoose.connect('mongodb://localhost:27017/blogDB');

      const db = mongooseConnection.connection.db;
      const gfs = new mongoose.mongo.GridFSBucket(db, {
        bucketName: 'uploads'
      });

      // Get list of files to restore
      const files = fs.readdirSync(filesBackupPath);
      console.log(`Found ${files.length} files to restore`);

      let restoredCount = 0;
      for (const filename of files) {
        const filePath = path.join(filesBackupPath, filename);
        const fileStats = fs.statSync(filePath);

        if (fileStats.isFile()) {
          console.log(`Restoring file: ${filename} (${this.formatFileSize(fileStats.size)})`);

          const uploadStream = gfs.openUploadStream(filename);
          const fileStream = fs.createReadStream(filePath);

          await new Promise((resolve, reject) => {
            fileStream.pipe(uploadStream)
              .on('error', reject)
              .on('finish', () => {
                restoredCount++;
                resolve();
              });
          });
        }
      }

      console.log(`GridFS files restore completed: ${restoredCount} files`);
      return true;
    } catch (error) {
      throw new Error(`GridFS restore failed: ${error.message}`);
    } finally {
      if (mongooseConnection) {
        await mongooseConnection.connection.close();
      }
    }
  }

  // Full system restore
  async fullRestore(backupName) {
    console.log(`Starting restore from: ${backupName}`);

    const backupPath = path.join(this.backupDir, backupName);

    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup not found: ${backupPath}`);
    }

    try {
      // Determine backup type and restore accordingly
      if (backupName.startsWith('blog-db-') && backupName.endsWith('.tar.gz')) {
        await this.restoreMongoDB(backupPath);
      } else if (backupName.startsWith('json-export-')) {
        await this.restoreFromJSON(backupPath);
      } else if (backupName.startsWith('files-backup-')) {
        await this.restoreGridFSFiles(backupPath);
      } else {
        // Try to auto-detect backup type
        const stats = fs.statSync(backupPath);
        if (stats.isDirectory()) {
          // Check if it's a JSON export
          if (fs.existsSync(path.join(backupPath, 'posts.json'))) {
            console.log('Auto-detected JSON export backup');
            await this.restoreFromJSON(backupPath);
          } else {
            throw new Error('Cannot determine backup type');
          }
        } else {
          throw new Error('Unknown backup type');
        }
      }

      console.log('Restore completed successfully!');
      return true;
    } catch (error) {
      console.error('Restore failed:', error.message);
      throw error;
    }
  }

  // Interactive restore
  async interactiveRestore() {
    const backups = this.listBackups();

    if (backups.length === 0) {
      console.log('No backups available for restore');
      return;
    }

    const readline = await import('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\nAvailable backups:');
    backups.forEach((backup, index) => {
      console.log(`${index + 1}. ${backup}`);
    });

    rl.question('\nSelect backup to restore (number): ', async (answer) => {
      const index = parseInt(answer) - 1;

      if (index >= 0 && index < backups.length) {
        const selectedBackup = backups[index];

        rl.question(`Are you sure you want to restore "${selectedBackup}"? This will overwrite current data. (yes/no): `, async (confirmation) => {
          if (confirmation.toLowerCase() === 'yes') {
            try {
              await this.fullRestore(selectedBackup);
              console.log('Restore completed successfully!');
            } catch (error) {
              console.error('Restore failed:', error.message);
            }
          } else {
            console.log('Restore cancelled');
          }
          rl.close();
        });
      } else {
        console.log('Invalid selection');
        rl.close();
      }
    });
  }
}

// CLI interface
if (process.argv[2] === '--list') {
  const restoreUtility = new BlogrestoreUtility();
  restoreUtility.listBackups();
} else if (process.argv[2] === '--restore' && process.argv[3]) {
  const restoreUtility = new BlogrestoreUtility();
  restoreUtility.fullRestore(process.argv[3]);
} else if (process.argv[2] === '--interactive') {
  const restoreUtility = new BlogrestoreUtility();
  restoreUtility.interactiveRestore();
} else {
  console.log(`
Usage:
  node restoreUtility.js --list                    List available backups
  node restoreUtility.js --interactive            Interactive restore
  node restoreUtility.js --restore <backup-name>  Restore specific backup

Examples:
  node restoreUtility.js --restore json-export-2025-10-05T18-22-55-958Z
  `);
}

export default BlogrestoreUtility;
