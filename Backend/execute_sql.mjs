// ===== EXECUTE SQL FILE ON PRODUCTION =====
// This script reads and executes the fix_procedures.sql file

import mysql from 'mysql2/promise';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

const DB_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: false
  },
  multipleStatements: true
};

async function executeSQLFile() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    console.log('📍 Host:', DB_CONFIG.host);
    console.log('📍 Database:', DB_CONFIG.database);
    
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('✅ Connected to database');

    // Read SQL file - try /tmp first (Docker), then local path
    console.log('\n📖 Reading SQL file...');
    let sqlContent;
    try {
      sqlContent = readFileSync('/tmp/fix_procedures.sql', 'utf8');
    } catch {
      // Fallback to local path for Windows/local development
      sqlContent = readFileSync(join(__dirname, 'fix_procedures.sql'), 'utf8');
    }
    console.log('✅ SQL file loaded');

    // Split by delimiter and execute each statement
    console.log('\n🔧 Executing SQL statements...');
    
    // Execute the full content (mysql2 supports multiple statements)
    const [results] = await connection.query(sqlContent);
    console.log('✅ SQL statements executed');

    // Verify procedures were created
    console.log('\n🔍 Verifying procedures...');
    const [procedures] = await connection.execute(`
      SELECT 
        ROUTINE_NAME as procedure_name,
        CREATED as creation_time
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? 
        AND ROUTINE_TYPE = 'PROCEDURE'
        AND ROUTINE_NAME IN ('getAllComplaintsDecrypted', 'getAllComplianceRecordsDecrypted')
      ORDER BY ROUTINE_NAME
    `, [DB_CONFIG.database]);

    console.log('\n✅ Created procedures:');
    procedures.forEach(proc => {
      console.log(`   - ${proc.procedure_name} (created: ${proc.creation_time})`);
    });

    if (procedures.length === 2) {
      console.log('\n🎉 All procedures created successfully!');
    } else {
      console.log('\n⚠️  Warning: Expected 2 procedures, found', procedures.length);
    }

  } catch (error) {
    console.error('❌ Error executing SQL:', error.message);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the script
console.log('🚀 Starting SQL execution...\n');
executeSQLFile()
  .then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed');
    process.exit(1);
  });
