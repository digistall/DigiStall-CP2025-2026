/**
 * Database Backup Script
 * Creates a backup of the MySQL database
 * 
 * Usage: node backup.cjs
 * Output: Creates a .sql file in the backups directory
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration from environment
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'naga_stall';
const DB_PORT = process.env.DB_PORT || 3306;

// Backup directory
const BACKUP_DIR = path.join(__dirname, 'backups');

// Create backup directory if it doesn't exist
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
  console.log('📁 Created backups directory');
}

// Generate backup filename with timestamp
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const backupFileName = `${DB_NAME}_backup_${timestamp}.sql`;
const backupFilePath = path.join(BACKUP_DIR, backupFileName);

// Build mysqldump command
const mysqldumpCmd = `mysqldump -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} --routines --triggers --single-transaction ${DB_NAME} > "${backupFilePath}"`;

console.log('🔄 Starting database backup...');
console.log(`📦 Database: ${DB_NAME}`);
console.log(`🖥️  Host: ${DB_HOST}:${DB_PORT}`);
console.log(`📄 Output: ${backupFilePath}`);

exec(mysqldumpCmd, (error, stdout, stderr) => {
  if (error) {
    console.error('❌ Backup failed:', error.message);
    if (stderr) console.error('Error details:', stderr);
    process.exit(1);
  }
  
  // Check if backup file was created and has content
  if (fs.existsSync(backupFilePath)) {
    const stats = fs.statSync(backupFilePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    console.log('✅ Backup completed successfully!');
    console.log(`📊 Backup size: ${fileSizeInMB} MB`);
    console.log(`📍 Location: ${backupFilePath}`);
  } else {
    console.error('❌ Backup file was not created');
    process.exit(1);
  }
});
