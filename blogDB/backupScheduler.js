// [file name]: backupScheduler.js
import { createBackup } from './backupUtility.js';

let lastChangeTimestamp = null;
let lastBackupTimestamp = null;

/**
 * Track when changes are made to the database
 */
export function trackChange() {
  lastChangeTimestamp = new Date();
  console.log(`📝 Change detected at: ${lastChangeTimestamp.toISOString()}`);
}

/**
 * Check if changes have been made since the last backup
 */
export function hasChangesSinceLastBackup() {
  return lastChangeTimestamp !== null &&
         (lastBackupTimestamp === null || lastChangeTimestamp > lastBackupTimestamp);
}

/**
 * Get time since last change in minutes
 */
export function getTimeSinceLastChange() {
  if (!lastChangeTimestamp) return null;
  const now = new Date();
  return Math.round((now - lastChangeTimestamp) / (1000 * 60));
}

/**
 * Get time since last backup in minutes
 */
export function getTimeSinceLastBackup() {
  if (!lastBackupTimestamp) return null;
  const now = new Date();
  return Math.round((now - lastBackupTimestamp) / (1000 * 60));
}

/**
 * Create backup and update timestamps
 */
export async function createScheduledBackup() {
  try {
    if (hasChangesSinceLastBackup()) {
      console.log('🔄 Changes detected, creating scheduled backup...');
      const backupName = `scheduled-backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
      const result = await createBackup(backupName);

      lastBackupTimestamp = new Date();
      lastChangeTimestamp = null; // Reset change tracking after successful backup

      console.log(`✅ Scheduled backup completed: ${backupName}`);
      console.log(`📊 Last change: ${getTimeSinceLastBackup()} minutes ago`);

      return result;
    } else {
      console.log('⏰ No changes detected since last backup');
      return { skipped: true, message: 'No changes detected' };
    }
  } catch (error) {
    console.error('⚠️ Scheduled backup failed:', error.message);
    throw error;
  }
}

/**
 * Force a backup regardless of changes
 */
export async function forceBackup(backupName = null) {
  try {
    const result = await createBackup(backupName);
    lastBackupTimestamp = new Date();
    lastChangeTimestamp = null;
    return result;
  } catch (error) {
    console.error('⚠️ Force backup failed:', error.message);
    throw error;
  }
}

/**
 * Get backup scheduler status
 */
export function getSchedulerStatus() {
  return {
    lastChange: lastChangeTimestamp,
    lastBackup: lastBackupTimestamp,
    changesPending: hasChangesSinceLastBackup(),
    minutesSinceLastChange: getTimeSinceLastChange(),
    minutesSinceLastBackup: getTimeSinceLastBackup()
  };
}

export default {
  trackChange,
  hasChangesSinceLastBackup,
  createScheduledBackup,
  forceBackup,
  getSchedulerStatus
};
