// [file name]: backupUtility.js
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class BlogbackupUtility {
  constructor() {
    this.backupDir = path.join(__dirname, 'backups');
    this.ensureBackupDir();
  }

  ensureBackupDir() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
    }
  }

  // MongoDB Database Backup
  async backupDatabase() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(this.backupDir, `blog-db-${timestamp}`);

    return new Promise((resolve, reject) => {
      const command = `mongodump --db blogDB --out ${backupPath}`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Database backup failed: ${error}`);
          return;
        }

        console.log(`Database backup created: ${backupPath}`);

        // Compress the backup
        this.compressBackup(backupPath, `${backupPath}.tar.gz`)
          .then(resolve)
          .catch(reject);
      });
    });
  }

  // Compress backup directory
  async compressBackup(sourcePath, destinationPath) {
    return new Promise((resolve, reject) => {
      const command = `tar -czf ${destinationPath} -C ${path.dirname(sourcePath)} ${path.basename(sourcePath)}`;

      exec(command, (error) => {
        if (error) {
          reject(`Compression failed: ${error}`);
          return;
        }

        // Remove uncompressed backup
        fs.rmSync(sourcePath, { recursive: true, force: true });
        resolve(destinationPath);
      });
    });
  }

  // Export data as JSON files (for portability)
  async exportToJSON() {
    await mongoose.connect('mongodb://localhost:27017/blogDB');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const exportDir = path.join(this.backupDir, `json-export-${timestamp}`);

    if (!fs.existsSync(exportDir)) {
      fs.mkdirSync(exportDir, { recursive: true });
    }

    try {
      const Post = mongoose.model('Post');
      const Topic = mongoose.model('Topic');

      const posts = await Post.find({});
      const topics = await Topic.find({});

      // Export posts
      fs.writeFileSync(
        path.join(exportDir, 'posts.json'),
        JSON.stringify(posts, null, 2)
      );

      // Export topics
      fs.writeFileSync(
        path.join(exportDir, 'topics.json'),
        JSON.stringify(topics, null, 2)
      );

      // Export metadata
      const metadata = {
        exportDate: new Date().toISOString(),
        postCount: posts.length,
        topicCount: topics.length
      };

      fs.writeFileSync(
        path.join(exportDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );

      console.log(`JSON export completed: ${exportDir}`);
      return exportDir;

    } finally {
      await mongoose.connection.close();
    }
  }

  // Backup GridFS files
  async backupGridFSFiles() {
    await mongoose.connect('mongodb://localhost:27017/blogDB');

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filesBackupDir = path.join(this.backupDir, `files-backup-${timestamp}`);

    if (!fs.existsSync(filesBackupDir)) {
      fs.mkdirSync(filesBackupDir, { recursive: true });
    }

    try {
      const db = mongoose.connection.db;
      const filesCollection = db.collection('uploads.files');
      const chunksCollection = db.collection('uploads.chunks');

      const files = await filesCollection.find({}).toArray();

      for (const file of files) {
        const filePath = path.join(filesBackupDir, file.filename);
        const writeStream = fs.createWriteStream(filePath);

        const chunks = await chunksCollection
          .find({ files_id: file._id })
          .sort({ n: 1 })
          .toArray();

        for (const chunk of chunks) {
          writeStream.write(chunk.data.buffer);
        }

        writeStream.end();
      }

      console.log(`GridFS files backup completed: ${filesBackupDir}`);
      return filesBackupDir;

    } finally {
      await mongoose.connection.close();
    }
  }

  // Full system backup
  async fullBackup() {
    console.log('Starting full backup...');

    try {
      const dbBackup = await this.backupDatabase();
      const jsonExport = await this.exportToJSON();
      const filesBackup = await this.backupGridFSFiles();

      console.log('Full backup completed successfully!');
      return {
        database: dbBackup,
        json: jsonExport,
        files: filesBackup
      };

    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  // Restore from backup
  async restoreDatabase(backupPath) {
    return new Promise((resolve, reject) => {
      const command = `mongorestore --db blogDB ${backupPath}/blogDB`;

      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(`Database restore failed: ${error}`);
          return;
        }

        console.log('Database restored successfully');
        resolve();
      });
    });
  }
}

// CLI interface for manual backups
if (process.argv[2] === '--backup') {
  const backupUtility = new BlogbackupUtility();
  backupUtility.fullBackup();
}

export default BlogbackupUtility;
