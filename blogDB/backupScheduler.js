// [file name]: backupScheduler.js
import cron from 'node-cron';
import BlogBackupUtility from './backupUtility.js';

class BackupScheduler {
  constructor() {
    this.backupUtility = new BlogBackupUtility();
  }

  start() {
    // Daily backup at 2 AM
    cron.schedule('0 2 * * *', async () => {
      console.log('Starting scheduled daily backup...');
      try {
        await this.backupUtility.fullBackup();
        console.log('Scheduled backup completed successfully');
      } catch (error) {
        console.error('Scheduled backup failed:', error);
      }
    });

    // Weekly backup on Sunday at 3 AM
    cron.schedule('0 3 * * 0', async () => {
      console.log('Starting scheduled weekly backup...');
      try {
        await this.backupUtility.fullBackup();
        console.log('Weekly backup completed successfully');
      } catch (error) {
        console.error('Weekly backup failed:', error);
      }
    });

    console.log('Backup scheduler started');
  }
}

// Start the scheduler
const scheduler = new BackupScheduler();
scheduler.start();

export default BackupScheduler;
