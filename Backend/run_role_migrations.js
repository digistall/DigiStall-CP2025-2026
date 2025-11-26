/**
 * Role Migration Runner
 * Applies all role system restructure migrations in correct order
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✅${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}❌${colors.reset} ${msg}`),
  header: (msg) => console.log(`\n${colors.bright}${msg}${colors.reset}\n`)
};

// Migration files in order
const MIGRATIONS = [
  {
    file: '024_role_system_restructure.sql',
    description: 'Restructure role system - Rename tables and create System Administrator'
  },
  {
    file: '025_system_administrator_procedures.sql',
    description: 'Create System Administrator stored procedures'
  },
  {
    file: '026_stall_business_owner_procedures.sql',
    description: 'Create Stall Business Owner stored procedures'
  },
  {
    file: '027_update_all_stored_procedures.sql',
    description: 'Update all existing stored procedures with new role names'
  }
];

async function checkMigrationStatus(connection) {
  log.header('Checking Migration Status');
  
  try {
    const [rows] = await connection.query(
      "SELECT migration_name FROM migrations WHERE migration_name LIKE '0%_role%' OR migration_name LIKE '0%_system%' OR migration_name LIKE '0%_stall%'"
    );
    
    const executed = rows.map(r => r.migration_name);
    
    if (executed.length > 0) {
      log.warning('Some role migrations have already been executed:');
      executed.forEach(name => console.log(`  - ${name}`));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      return new Promise((resolve) => {
        readline.question('\nDo you want to continue? (yes/no): ', (answer) => {
          readline.close();
          resolve(answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y');
        });
      });
    } else {
      log.info('No role migrations have been executed yet.');
      return true;
    }
  } catch (error) {
    log.warning('Could not check migration status (migrations table may not exist)');
    return true;
  }
}

async function createBackup(connection, dbName) {
  log.header('Creating Database Backup');
  
  try {
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupFile = path.join(__dirname, `../database/backups/backup_${dbName}_${timestamp}.sql`);
    
    // Ensure backup directory exists
    const backupDir = path.join(__dirname, '../database/backups');
    await fs.mkdir(backupDir, { recursive: true });
    
    log.info(`Creating backup at: ${backupFile}`);
    
    // This is a simplified backup - in production use mysqldump
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    
    const password = process.env.DB_PASSWORD || '';
    const user = process.env.DB_USER || 'root';
    const host = process.env.DB_HOST || 'localhost';
    
    const command = `mysqldump -h ${host} -u ${user} ${password ? `-p${password}` : ''} ${dbName} > "${backupFile}"`;
    
    try {
      await execPromise(command);
      log.success('Backup created successfully');
      return backupFile;
    } catch (error) {
      log.warning('Could not create automatic backup. Please create manual backup before proceeding.');
      log.warning(`Error: ${error.message}`);
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      return new Promise((resolve, reject) => {
        readline.question('\nHave you created a manual backup? (yes/no): ', (answer) => {
          readline.close();
          if (answer.toLowerCase() === 'yes' || answer.toLowerCase() === 'y') {
            resolve(null);
          } else {
            reject(new Error('Backup required before proceeding'));
          }
        });
      });
    }
  } catch (error) {
    log.error(`Backup failed: ${error.message}`);
    throw error;
  }
}

async function runMigration(connection, migration, index, total) {
  const { file, description } = migration;
  
  log.info(`[${index + 1}/${total}] Running: ${file}`);
  log.info(`Description: ${description}`);
  
  try {
    const sqlPath = path.join(__dirname, '../database/migrations', file);
    const sql = await fs.readFile(sqlPath, 'utf8');
    
    // Split by delimiter to handle stored procedures
    const statements = sql.split('DELIMITER');
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement && statement !== '$$' && statement !== ';') {
        // Remove delimiter declarations
        const cleanStatement = statement.replace(/\$\$/g, '');
        if (cleanStatement.trim()) {
          await connection.query(cleanStatement);
        }
      }
    }
    
    log.success(`${file} completed successfully`);
    return true;
  } catch (error) {
    log.error(`${file} failed: ${error.message}`);
    throw error;
  }
}

async function verifyMigrations(connection) {
  log.header('Verifying Migrations');
  
  const checks = [
    {
      name: 'system_administrator table',
      query: "SHOW TABLES LIKE 'system_administrator'"
    },
    {
      name: 'stall_business_owner table',
      query: "SHOW TABLES LIKE 'stall_business_owner'"
    },
    {
      name: 'business_manager table',
      query: "SHOW TABLES LIKE 'business_manager'"
    },
    {
      name: 'business_employee table',
      query: "SHOW TABLES LIKE 'business_employee'"
    },
    {
      name: 'createSystemAdministrator procedure',
      query: "SHOW PROCEDURE STATUS WHERE Name = 'createSystemAdministrator'"
    },
    {
      name: 'createStallBusinessOwner procedure',
      query: "SHOW PROCEDURE STATUS WHERE Name = 'createStallBusinessOwner'"
    },
    {
      name: 'createBusinessEmployee procedure',
      query: "SHOW PROCEDURE STATUS WHERE Name = 'createBusinessEmployee'"
    }
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    try {
      const [rows] = await connection.query(check.query);
      if (rows.length > 0) {
        log.success(`${check.name} exists`);
      } else {
        log.error(`${check.name} not found`);
        allPassed = false;
      }
    } catch (error) {
      log.error(`${check.name} check failed: ${error.message}`);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function main() {
  log.header('🚀 DigiStall Role System Migration Runner');
  
  console.log('This script will:');
  console.log('1. Create a database backup');
  console.log('2. Apply role system restructure migrations');
  console.log('3. Verify migrations completed successfully\n');
  
  let connection;
  
  try {
    // Database configuration
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'naga_stall',
      multipleStatements: true
    };
    
    log.info(`Connecting to database: ${dbConfig.database}`);
    connection = await mysql.createConnection(dbConfig);
    log.success('Connected to database');
    
    // Check if migrations already executed
    const shouldContinue = await checkMigrationStatus(connection);
    if (!shouldContinue) {
      log.warning('Migration cancelled by user');
      process.exit(0);
    }
    
    // Create backup
    await createBackup(connection, dbConfig.database);
    
    // Run migrations
    log.header('Running Migrations');
    
    for (let i = 0; i < MIGRATIONS.length; i++) {
      await runMigration(connection, MIGRATIONS[i], i, MIGRATIONS.length);
    }
    
    // Verify migrations
    const verified = await verifyMigrations(connection);
    
    if (verified) {
      log.header('🎉 Migration Completed Successfully!');
      
      console.log('\nNext Steps:');
      console.log('1. ✅ Update backend code (models, controllers, routes, services)');
      console.log('2. ✅ Update frontend code (stores, components, routing)');
      console.log('3. ✅ Test all functionality');
      console.log('4. ✅ Change default system admin password\n');
      
      console.log('Default System Administrator Account:');
      console.log('  Username: sysadmin');
      console.log('  Password: SysAdmin@2025');
      console.log('  ⚠️  CHANGE THIS PASSWORD IMMEDIATELY!\n');
      
      log.success('See ROLE_MIGRATION_README.md for detailed instructions');
    } else {
      log.error('Some verifications failed. Please check the output above.');
      process.exit(1);
    }
    
  } catch (error) {
    log.error(`Migration failed: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      log.info('Database connection closed');
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { main };
