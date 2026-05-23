// ===== RESTORE DATABASE BACKUP TO LOCALHOST =====
// Restores a SQL backup file into local MySQL for localhost Workbench use.
//
// Usage:
//   node restore_backup_to_localhost.cjs [backup_file.sql] [--yes]
//
// If no backup file is provided, the newest FULL_DATABASE_BACKUP*.sql in this
// folder is used.

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const dotenv = require('dotenv');

const localEnvPath = path.join(__dirname, '../.env.local');
if (fs.existsSync(localEnvPath)) {
  const parsedLocalEnv = dotenv.parse(fs.readFileSync(localEnvPath));
  Object.assign(process.env, parsedLocalEnv);
}

const dbConfig = {
  host: process.env.LOCAL_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.LOCAL_DB_PORT || process.env.DB_PORT || '3301', 10),
  user: process.env.LOCAL_DB_USER || process.env.DB_USER || 'root',
  password: process.env.LOCAL_DB_PASSWORD !== undefined
    ? process.env.LOCAL_DB_PASSWORD
    : (process.env.DB_PASSWORD || ''),
  multipleStatements: true
};

const databaseName = process.env.LOCAL_DB_NAME || process.env.DB_NAME || 'naga_stall';

function parseArgs() {
  const args = process.argv.slice(2);
  let backupFile = null;
  let skipConfirm = false;

  for (const arg of args) {
    if (arg === '--yes' || arg === '-y' || arg === '--force') {
      skipConfirm = true;
      continue;
    }

    if (!backupFile) {
      backupFile = arg;
    }
  }

  return { backupFile, skipConfirm };
}

function findLatestBackup() {
  const files = fs.readdirSync(__dirname)
    .filter((fileName) => fileName.toUpperCase().startsWith('FULL_DATABASE_BACKUP') && fileName.endsWith('.sql'))
    .map((fileName) => {
      const fullPath = path.join(__dirname, fileName);
      return {
        fileName,
        fullPath,
        mtimeMs: fs.statSync(fullPath).mtimeMs
      };
    })
    .sort((a, b) => b.mtimeMs - a.mtimeMs);

  return files.length > 0 ? files[0].fullPath : null;
}

async function confirmRestore(backupFile, skipConfirm) {
  if (skipConfirm) {
    return true;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    console.log('\nWARNING: This will DELETE ALL DATA in your LOCAL database.');
    console.log(`  Database: ${databaseName}`);
    console.log(`  Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`  Backup File: ${path.basename(backupFile)}`);
    console.log('');

    rl.question('Type "YES" to continue: ', (answer) => {
      rl.close();
      resolve(answer === 'YES');
    });
  });
}

async function restoreDatabaseToLocalhost(backupFile, skipConfirm) {
  let connection;

  console.log('==============================================================');
  console.log(' RESTORE BACKUP TO LOCALHOST');
  console.log('==============================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);
  console.log(`Backup File: ${path.basename(backupFile)}`);
  console.log(`Target Database: ${databaseName}`);
  console.log(`Target Host: ${dbConfig.host}:${dbConfig.port}`);

  try {
    console.log('\nReading backup file...');
    if (!fs.existsSync(backupFile)) {
      throw new Error(`Backup file not found: ${backupFile}`);
    }

    const fileSize = fs.statSync(backupFile).size;
    console.log(`  File size: ${(fileSize / 1024 / 1024).toFixed(2)} MB`);

    const sqlContent = fs.readFileSync(backupFile, 'utf8');
    console.log('  Backup file loaded successfully');

    const confirmed = await confirmRestore(backupFile, skipConfirm);
    if (!confirmed) {
      console.log('\nRestore cancelled by user.');
      process.exit(0);
    }

    console.log('\nConnecting to local MySQL...');
    connection = await mysql.createConnection({
      ...dbConfig,
      multipleStatements: true
    });
    console.log('Connected successfully.');

    console.log('\nDropping existing local database...');
    await connection.execute(`DROP DATABASE IF EXISTS \`${databaseName}\``);
    console.log('  Existing database dropped');

    console.log('Creating local database...');
    await connection.execute(`CREATE DATABASE \`${databaseName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log('  New database created');

    await connection.execute(`USE \`${databaseName}\``);
    console.log(`  Using database: ${databaseName}`);

    console.log('\nExecuting SQL restore (this may take a while)...');

    const lines = sqlContent.split('\n');
    let currentDelimiter = ';';
    let currentStatement = '';
    let statementCount = 0;
    let errorCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }

      if (trimmedLine.toUpperCase().startsWith('DELIMITER')) {
        const match = trimmedLine.match(/DELIMITER\s+(\S+)/i);
        if (match) {
          currentDelimiter = match[1];
          continue;
        }
      }

      currentStatement += line + '\n';

      if (trimmedLine.endsWith(currentDelimiter)) {
        let statement = currentStatement.trim();

        if (currentDelimiter !== ';') {
          statement = statement.slice(0, -currentDelimiter.length);
        }

        if (statement.trim()) {
          try {
            await connection.execute(statement);
            statementCount++;

            if (statementCount % 50 === 0) {
              process.stdout.write(`\r  Executed ${statementCount} statements...`);
            }
          } catch (err) {
            if (
              !err.message.includes('already exists')
              && !err.message.includes('Duplicate entry')
              && !err.message.includes("doesn't exist")
            ) {
              errorCount++;
              if (errorCount <= 10) {
                console.log(`\n  Warning: ${err.message}`);
              }
            }
          }
        }

        currentStatement = '';
      }
    }

    console.log(`\r  Executed ${statementCount} statements.                `);
    if (errorCount > 0) {
      console.log(`  Warnings: ${errorCount} errors during restore`);
    }

    console.log('\nVerifying restored local database...');

    const [tableCount] = await connection.execute(
      'SELECT COUNT(*) as cnt FROM information_schema.TABLES WHERE TABLE_SCHEMA = ?',
      [databaseName]
    );
    console.log(`  Tables: ${tableCount[0].cnt}`);

    const [viewCount] = await connection.execute(
      'SELECT COUNT(*) as cnt FROM information_schema.VIEWS WHERE TABLE_SCHEMA = ?',
      [databaseName]
    );
    console.log(`  Views: ${viewCount[0].cnt}`);

    const [procedureCount] = await connection.execute(
      "SELECT COUNT(*) as cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'",
      [databaseName]
    );
    console.log(`  Stored Procedures: ${procedureCount[0].cnt}`);

    const [functionCount] = await connection.execute(
      "SELECT COUNT(*) as cnt FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'",
      [databaseName]
    );
    console.log(`  Functions: ${functionCount[0].cnt}`);

    const [triggerCount] = await connection.execute(
      'SELECT COUNT(*) as cnt FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = ?',
      [databaseName]
    );
    console.log(`  Triggers: ${triggerCount[0].cnt}`);

    console.log('\n==============================================================');
    console.log(' LOCAL RESTORE COMPLETE');
    console.log('==============================================================');
    console.log('Open MySQL Workbench and connect to your local instance to verify data.');
  } catch (error) {
    console.error('\nRestore failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\nLocal MySQL connection closed.');
    }
  }
}

async function main() {
  const { backupFile, skipConfirm } = parseArgs();

  let backupFilePath = backupFile;
  if (!backupFilePath) {
    backupFilePath = findLatestBackup();
    if (!backupFilePath) {
      console.error('No backup file specified and no FULL_DATABASE_BACKUP*.sql file was found.');
      console.error('Usage: node restore_backup_to_localhost.cjs [backup_file.sql] [--yes]');
      process.exit(1);
    }

    console.log(`Using latest backup file: ${path.basename(backupFilePath)}`);
  } else if (!path.isAbsolute(backupFilePath)) {
    backupFilePath = path.join(__dirname, backupFilePath);
  }

  await restoreDatabaseToLocalhost(backupFilePath, skipConfirm);
}

main();
