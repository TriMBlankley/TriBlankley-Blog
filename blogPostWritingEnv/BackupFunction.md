'''bash
node backupUtility.js
node backupUtility.js "my-custom-backup-name"
node backupUtility.js list
node backupUtility.js delete "backup-2024-01-15.zip"
'''

Restoring a Backup
'''bash
# Interactive mode
node restoreBackup.js

# Command line mode
node restoreBackup.js --restore "./backups/backup-2024-01-15.zip"

# With options
node restoreBackup.js --restore "./backups/backup-2024-01-15.zip" --db-only --skip-confirm

# List available backups
node restoreBackup.js --list
'''


Using the API to create a backup:
'''js
// Create backup
fetch('/api/backup', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ backupName: 'manual-backup' })
});

// List backups
fetch('/api/backups').then(r => r.json());
'''