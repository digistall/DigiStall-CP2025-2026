// ===== DATABASE RESTORE SCRIPT =====
// This script restores the database from a backup SQL file
// It will DROP the existing database and recreate it from the backup
//
// Usage: node restore_database.cjs [backup_file.sql]
// If no file specified, it will use the most recent backup file

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  multipleStatements: true
};

const databaseName = process.env.DB_NAME || 'naga_stall_digitalocean';

// Find the most recent backup file
function findLatestBackup() {
  const files = fs.readdirSync(__dirname)
    .filter(f => f.startsWith('FULL_DATABASE_BACKUP_') && f.endsWith('.sql'))
    .sort()
    .reverse();
  
  return files.length > 0 ? path.join(__dirname, files[0]) : null;
}

// Prompt for user confirmation
async function confirmRestore(backupFile) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\n⚠️  WARNING: This will DELETE ALL DATA in the database!');
    console.log(`   Database: ${databaseName}`);
    console.log(`   Host: ${dbConfig.host}`);
    console.log(`   Backup File: ${path.basename(backupFile)}`);
    console.log('');
    
    rl.question('Are you sure you want to continue? (type "YES" to confirm): ', (answer) => {
      rl.close();
      resolve(answer === 'YES');
    });
  });
}

async function restoreDatabase(backupFile) {
  let connection;

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   DATABASE RESTORE SCRIPT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`📄 Backup File: ${path.basename(backupFile)}`);
  console.log(`🗄️  Target Database: ${databaseName}`);
  console.log(`🌐 Host: ${dbConfig.host}`);

  try {
    // Read backup file
    console.log('\n📖 Reading backup file...');
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }
    
    const fileSize = fs.statSync(backupFile).size;
    console.log(`   File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);
    
    const sqlContent = fs.readFileSync(backupFile, 'utf8');
    console.log('   ✅ File loaded successfully');

    // Confirm with user
    const confirmed = await confirmRestore(backupFile);
    if (!confirmed) {
      console.log('\n❌ Restore cancelled by user');
      process.exit(0);
    }

    // Connect to database (without selecting a database)
    console.log('\n🔌 Connecting to database server...');
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true
    });
    console.log('✅ Connected successfully!');

    // Drop and recreate database
    console.log('\n🗑️  Dropping existing database...');
    await connection.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    console.log('   ✅ Database dropped');

    console.log('\n📦 Creating new database...');
    await connection.execute(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('   ✅ Database created');

    await connection.execute(`USE \`${databaseName}\``);
    console.log(`   ✅ Using database: ${databaseName}`);

    // Split SQL into executable statements
    console.log('\n⏳ Executing restore (this may take a while)...');
    
    // Process the SQL file
    // Handle DELIMITER changes for procedures/functions
    const lines = sqlContent.split('\n');
    let currentDelimiter = ';';
    let currentStatement = '';
    let statementCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // Skip empty lines and comments
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }

      // Check for DELIMITER change
      if (trimmedLine.toUpperCase().startsWith('DELIMITER')) {
        const match = trimmedLine.match(/DELIMITER\s+(\S+)/i);
        if (match) {
          currentDelimiter = match[1];
          continue;
        }
      }

      currentStatement += line + '\n';

      // Check if statement is complete
      if (trimmedLine.endsWith(currentDelimiter)) {
        // Remove the delimiter from the end
        let stmt = currentStatement.trim();
        if (currentDelimiter !== ';') {
          stmt = stmt.slice(0, -currentDelimiter.length);
        }

        if (stmt.trim()) {
          try {
            await connection.execute(stmt);
            statementCount++;
            
            // Progress indicator
            if (statementCount % 50 === 0) {
              process.stdout.write(`\r   Executed ${statementCount} statements...`);
            }
          } catch (err) {
            // Log but continue on errors (some may be expected)
            if (!err.message.includes('already exists') && 
                !err.message.includes('Duplicate entry') &&
                !err.message.includes('doesn\'t exist')) {
              errorCount++;
              if (errorCount <= 10) {
                console.log(`\n   ⚠️  Error in statement: ${err.message}`);
              }
            }
          }
        }
        currentStatement = '';
      }
    }

    console.log(`\r   ✅ Executed ${statementCount} statements                    `);
    if (errorCount > 0) {
      console.log(`   ⚠️  ${errorCount} errors (some may be expected)`);
    }

    // Verify restore
    console.log('\n📋 Verifying restore...');
    
    const [tables] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?`,
      [databaseName]
    );
    console.log(`   Tables: ${tables[0].cnt}`);

    const [views] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ?`,
      [databaseName]
    );
    console.log(`   Views: ${views[0].cnt}`);

    const [procedures] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'`,
      [databaseName]
    );
    console.log(`   Stored Procedures: ${procedures[0].cnt}`);

    const [functions] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'`,
      [databaseName]
    );
    console.log(`   Functions: ${functions[0].cnt}`);

    const [triggers] = await connection.execute(
      `SELECT COUNT(*) as cnt FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?`,
      [databaseName]
    );
    console.log(`   Triggers: ${triggers[0].cnt}`);

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   ✅ DATABASE RESTORE COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Main execution
async function main() {
  // Get backup file from argument or find latest
  let backupFile = process.argv[2];
  
  if (!backupFile) {
    backupFile = findLatestBackup();
    if (!backupFile) {
      console.error('❌ No backup file specified and no backup files found');
      console.error('   Usage: node restore_database.cjs [backup_file.sql]');
      console.error('   Or run backup_full_database.cjs first to create a backup');
      process.exit(1);
    }
    console.log(`📄 Using latest backup: ${path.basename(backupFile)}`);
  } else if (!path.isAbsolute(backupFile)) {
    backupFile = path.join(__dirname, backupFile);
  }

  await restoreDatabase(backupFile);
}

main();
