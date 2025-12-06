// [file name]: restoreBackup.js
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { blogPost, blogTopic, PostGroup } from './blogPostSchema.js';
import unzipper from 'unzipper';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

/**
 * Restore blog system from a backup
 */
export async function restoreBackup(backupPath, options = {}) {
  try {
    const {
      skipConfirmation = false,
      preserveExisting = false,
      onlyDatabase = false
    } = options;
    
    // Validate backup file
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }
    
    if (!backupPath.endsWith('.zip')) {
      throw new Error('Backup file must be a .zip file');
    }
    
    console.log(`🔍 Validating backup: ${path.basename(backupPath)}`);
    
    // Extract backup
    const tempDir = path.join(__dirname, 'temp_restore');
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
    fs.mkdirSync(tempDir, { recursive: true });
    
    console.log('📦 Extracting backup...');
    await extractBackup(backupPath, tempDir);
    
    // Read manifest
    const manifestPath = path.join(tempDir, 'manifest.json');
    if (!fs.existsSync(manifestPath)) {
      throw new Error('Invalid backup: manifest.json not found');
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    console.log('📄 Backup Information:');
    console.log(`   Date: ${new Date(manifest.backupDate).toLocaleString()}`);
    console.log(`   Posts: ${manifest.collections.posts}`);
    console.log(`   Topics: ${manifest.collections.topics}`);
    console.log(`   Post Groups: ${manifest.collections.postGroups}`);
    console.log(`   Files: ${manifest.files}`);
    
    // Ask for confirmation
    if (!skipConfirmation) {
      console.log('\n⚠️  WARNING: This will restore data to your blog database.');
      console.log('   Existing data may be overwritten or removed.');
      
      const answer = await askQuestion('Are you sure you want to continue? (yes/no): ');
      if (answer.toLowerCase() !== 'yes') {
        console.log('Restore cancelled.');
        cleanupTemp(tempDir);
        rl.close();
        return;
      }
      
      if (!preserveExisting) {
        const clearAnswer = await askQuestion('Clear existing data before restore? (yes/no): ');
        if (clearAnswer.toLowerCase() === 'yes') {
          console.log('🗑️  Clearing existing data...');
        }
      }
    }
    
    // Connect to MongoDB
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect('mongodb://localhost:27017/blogDB');
    
    const conn = mongoose.connection;
    const gfs = new GridFSBucket(conn.db, {
      bucketName: 'uploads'
    });
    
    // Clear existing data if requested
    if (!preserveExisting) {
      await clearExistingData(gfs, onlyDatabase);
    }
    
    // Restore collections
    console.log('📊 Restoring collections...');
    await restoreCollections(tempDir, preserveExisting);
    
    // Restore files if requested
    if (!onlyDatabase) {
      console.log('📎 Restoring files...');
      await restoreFiles(tempDir, gfs);
    }
    
    // Cleanup
    cleanupTemp(tempDir);
    
    console.log('✅ Restore completed successfully!');
    console.log('\n📊 Restore Summary:');
    console.log(`   Posts: ${manifest.collections.posts}`);
    console.log(`   Topics: ${manifest.collections.topics}`);
    console.log(`   Post Groups: ${manifest.collections.postGroups}`);
    if (!onlyDatabase) {
      console.log(`   Files: ${manifest.files}`);
    }
    
    return {
      success: true,
      manifest,
      restoredAt: new Date().toISOString()
    };
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
    throw error;
  } finally {
    rl.close();
  }
}

/**
 * Extract backup zip file
 */
async function extractBackup(zipPath, outputDir) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: outputDir }))
      .on('close', resolve)
      .on('error', reject);
  });
}

/**
 * Clear existing data from database
 */
async function clearExistingData(gfs, onlyDatabase = false) {
  // Clear collections
  await Promise.all([
    blogPost.deleteMany({}),
    blogTopic.deleteMany({}),
    PostGroup.deleteMany({})
  ]);
  
  // Clear GridFS files if requested
  if (!onlyDatabase) {
    const filesCollection = gfs.s._filesCollection;
    const chunksCollection = gfs.s._chunksCollection;
    
    await Promise.all([
      filesCollection.deleteMany({}),
      chunksCollection.deleteMany({})
    ]);
  }
}

/**
 * Restore collections from JSON files
 */
async function restoreCollections(tempDir, preserveExisting) {
  // Restore post groups first (for references)
  const postGroupsPath = path.join(tempDir, 'postGroups.json');
  if (fs.existsSync(postGroupsPath)) {
    const postGroupsData = JSON.parse(fs.readFileSync(postGroupsPath, 'utf8'));
    
    if (!preserveExisting) {
      await PostGroup.deleteMany({});
    }
    
    for (const groupData of postGroupsData) {
      // Remove _id to allow MongoDB to generate new ones
      const { _id, ...group } = groupData;
      await PostGroup.create(group);
    }
    
    console.log(`   Restored ${postGroupsData.length} post groups`);
  }
  
  // Restore topics
  const topicsPath = path.join(tempDir, 'topics.json');
  if (fs.existsSync(topicsPath)) {
    const topicsData = JSON.parse(fs.readFileSync(topicsPath, 'utf8'));
    
    if (!preserveExisting) {
      await blogTopic.deleteMany({});
    }
    
    for (const topicData of topicsData) {
      const { _id, ...topic } = topicData;
      await blogTopic.create(topic);
    }
    
    console.log(`   Restored ${topicsData.length} topics`);
  }
  
  // Restore posts
  const postsPath = path.join(tempDir, 'posts.json');
  if (fs.existsSync(postsPath)) {
    const postsData = JSON.parse(fs.readFileSync(postsPath, 'utf8'));
    
    if (!preserveExisting) {
      await blogPost.deleteMany({});
    }
    
    for (const postData of postsData) {
      const { _id, ...post } = postData;
      
      // Handle postGroup references if they exist
      if (post.postGroup && post.postGroup.groupId) {
        // Find the new group ID by name
        const group = await PostGroup.findOne({ groupName: post.postGroup.groupName });
        if (group) {
          post.postGroup.groupId = group._id;
        }
      }
      
      await blogPost.create(post);
    }
    
    console.log(`   Restored ${postsData.length} posts`);
  }
}

/**
 * Restore GridFS files
 */
async function restoreFiles(tempDir, gfs) {
  const filesDir = path.join(tempDir, 'files');
  
  if (!fs.existsSync(filesDir)) {
    console.log('   No files directory found in backup');
    return;
  }
  
  const files = fs.readdirSync(filesDir)
    .filter(file => !file.endsWith('.meta.json'))
    .map(file => {
      const fileId = path.basename(file);
      const filePath = path.join(filesDir, file);
      const metaPath = path.join(filesDir, `${file}.meta.json`);
      
      if (fs.existsSync(metaPath)) {
        const metadata = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
        return {
          originalId: metadata._id,
          filename: metadata.filename,
          contentType: metadata.contentType,
          filePath,
          metadata: metadata.metadata
        };
      }
      
      return null;
    })
    .filter(Boolean);
  
  console.log(`   Found ${files.length} files to restore`);
  
  for (const file of files) {
    try {
      const fileBuffer = fs.readFileSync(file.filePath);
      
      await new Promise((resolve, reject) => {
        const uploadStream = gfs.openUploadStream(file.filename, {
          contentType: file.contentType,
          metadata: file.metadata
        });
        
        uploadStream.end(fileBuffer);
        
        uploadStream.on('finish', () => {
          console.log(`     ✓ ${file.filename}`);
          resolve();
        });
        
        uploadStream.on('error', reject);
      });
    } catch (error) {
      console.error(`     ✗ Failed to restore ${file.filename}:`, error.message);
    }
  }
}

/**
 * Cleanup temporary directory
 */
function cleanupTemp(tempDir) {
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

/**
 * List available backups for restoration
 */
export function listAvailableBackups() {
  const backupsDir = path.join(__dirname, 'backups');
  
  if (!fs.existsSync(backupsDir)) {
    return [];
  }
  
  return fs.readdirSync(backupsDir)
    .filter(file => file.endsWith('.zip'))
    .map(file => ({
      name: file,
      path: path.join(backupsDir, file),
      size: formatFileSize(path.join(backupsDir, file))
    }))
    .sort((a, b) => b.name.localeCompare(a.name)); // Sort by newest first
}

/**
 * Format file size for display
 */
function formatFileSize(filePath) {
  const stats = fs.statSync(filePath);
  const bytes = stats.size;
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  
  const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
  return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
}

/**
 * Interactive restore wizard
 */
export async function interactiveRestore() {
  console.log('🔧 Blog Backup Restore Utility\n');
  
  const backups = listAvailableBackups();
  
  if (backups.length === 0) {
    console.log('❌ No backups found in the backups directory.');
    console.log('   Please place a backup .zip file in the backups folder.');
    return;
  }
  
  console.log('📋 Available backups:');
  backups.forEach((backup, index) => {
    console.log(`   ${index + 1}. ${backup.name} (${backup.size})`);
  });
  console.log(`   ${backups.length + 1}. Specify custom backup path\n`);
  
  const choice = await askQuestion(`Select backup to restore (1-${backups.length + 1}): `);
  let selectedBackup;
  
  if (parseInt(choice) === backups.length + 1) {
    const customPath = await askQuestion('Enter full path to backup file: ');
    selectedBackup = customPath.trim();
  } else if (parseInt(choice) >= 1 && parseInt(choice) <= backups.length) {
    selectedBackup = backups[parseInt(choice) - 1].path;
  } else {
    console.log('❌ Invalid selection.');
    rl.close();
    return;
  }
  
  console.log(`\n⚙️  Restore options:`);
  console.log('   1. Full restore (database + files)');
  console.log('   2. Database only');
  console.log('   3. Custom options\n');
  
  const optionChoice = await askQuestion('Select restore option (1-3): ');
  
  let options = {};
  
  if (optionChoice === '2') {
    options.onlyDatabase = true;
  } else if (optionChoice === '3') {
    const preserve = await askQuestion('Preserve existing data? (yes/no): ');
    options.preserveExisting = preserve.toLowerCase() === 'yes';
    
    const onlyDB = await askQuestion('Restore database only? (yes/no): ');
    options.onlyDatabase = onlyDB.toLowerCase() === 'yes';
  }
  
  console.log('\n🚀 Starting restore process...');
  await restoreBackup(selectedBackup, { ...options, skipConfirmation: true });
}

// If run directly, start interactive restore
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv[2] === '--list') {
    const backups = listAvailableBackups();
    console.log('Available backups:');
    backups.forEach(backup => {
      console.log(`  ${backup.name} (${backup.size})`);
    });
    process.exit(0);
  } else if (process.argv[2] === '--restore' && process.argv[3]) {
    const backupPath = process.argv[3];
    const options = {
      skipConfirmation: process.argv.includes('--skip-confirm'),
      preserveExisting: process.argv.includes('--preserve'),
      onlyDatabase: process.argv.includes('--db-only')
    };
    
    restoreBackup(backupPath, options)
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  } else {
    interactiveRestore();
  }
}

export default {
  restoreBackup,
  listAvailableBackups,
  interactiveRestore
};