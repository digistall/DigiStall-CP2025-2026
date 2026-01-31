/**
 * Database Restore Script
 * Restores a MySQL database from a backup file
 * 
 * Usage: node restore.cjs [backup_file.sql]
 * If no file is specified, it will list available backups
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration from environment
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASSWORD = process.env.DB_PASSWORD || '';
const DB_NAME = process.env.DB_NAME || 'naga_stall';
const DB_PORT = process.env.DB_PORT || 3306;

// Backup directory
const BACKUP_DIR = path.join(__dirname, 'backups');

// Get backup file from command line argument
const backupFile = process.argv[2];

// Function to list available backups
function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backups directory found');
    console.log('💡 Run backup.cjs first to create a backup');
    return [];
  }
  
  const files = fs.readdirSync(BACKUP_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort()
    .reverse();
  
  if (files.length === 0) {
    console.log('❌ No backup files found');
    console.log('💡 Run backup.cjs first to create a backup');
    return [];
  }
  
  console.log('\n📋 Available backups:');
  console.log('─'.repeat(60));
  files.forEach((file, index) => {
    const filePath = path.join(BACKUP_DIR, file);
    const stats = fs.statSync(filePath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`${index + 1}. ${file} (${fileSizeInMB} MB)`);
  });
  console.log('─'.repeat(60));
  
  return files;
}

// Function to restore database
function restoreDatabase(filePath) {
  const mysqlCmd = `mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} ${DB_PASSWORD ? `-p${DB_PASSWORD}` : ''} ${DB_NAME} < "${filePath}"`;
  
  console.log('\n🔄 Starting database restore...');
  console.log(`📦 Database: ${DB_NAME}`);
  console.log(`🖥️  Host: ${DB_HOST}:${DB_PORT}`);
  console.log(`📄 Backup file: ${filePath}`);
  
  exec(mysqlCmd, (error, stdout, stderr) => {
    if (error) {
      console.error('❌ Restore failed:', error.message);
      if (stderr) console.error('Error details:', stderr);
      process.exit(1);
    }
    
    console.log('✅ Database restored successfully!');
  });
}

// Interactive mode
async function interactiveRestore() {
  const files = listBackups();
  
  if (files.length === 0) {
    process.exit(1);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  rl.question('\n🔢 Enter backup number to restore (or "q" to quit): ', (answer) => {
    rl.close();
    
    if (answer.toLowerCase() === 'q') {
      console.log('👋 Restore cancelled');
      process.exit(0);
    }
    
    const index = parseInt(answer) - 1;
    
    if (isNaN(index) || index < 0 || index >= files.length) {
      console.log('❌ Invalid selection');
      process.exit(1);
    }
    
    const selectedFile = path.join(BACKUP_DIR, files[index]);
    
    // Confirm restore
    const rl2 = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    rl2.question(`\n⚠️  WARNING: This will overwrite the current database "${DB_NAME}".\n   Are you sure? (yes/no): `, (confirm) => {
      rl2.close();
      
      if (confirm.toLowerCase() === 'yes') {
        restoreDatabase(selectedFile);
      } else {
        console.log('👋 Restore cancelled');
        process.exit(0);
      }
    });
  });
}

// Main execution
if (backupFile) {
  // Direct restore with specified file
  let filePath = backupFile;
  
  // Check if it's a relative path
  if (!path.isAbsolute(backupFile)) {
    filePath = path.join(BACKUP_DIR, backupFile);
  }
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Backup file not found: ${filePath}`);
    listBackups();
    process.exit(1);
  }
  
  restoreDatabase(filePath);
} else {
  // Interactive mode
  interactiveRestore();
}
