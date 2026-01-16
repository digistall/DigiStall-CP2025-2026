// ===== RUN SQL FIX FOR EMAIL-BASED LOGIN PROCEDURES =====
// Run this script to update stored procedures

import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 25060,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  multipleStatements: true
};

async function runFix() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to:', dbConfig.host);
    
    // Check current table structure
    console.log('\n📋 Checking current table structures...');
    
    const [inspectorCols] = await connection.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'inspector'",
      [dbConfig.database]
    );
    console.log('Inspector columns:', inspectorCols.map(c => c.COLUMN_NAME).join(', '));
    
    const [collectorCols] = await connection.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'collector'",
      [dbConfig.database]
    );
    console.log('Collector columns:', collectorCols.map(c => c.COLUMN_NAME).join(', '));
    
    const [employeeCols] = await connection.execute(
      "SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'business_employee'",
      [dbConfig.database]
    );
    console.log('Business Employee columns:', employeeCols.map(c => c.COLUMN_NAME).join(', '));
    
    // Read and execute the SQL file
    console.log('\n🔧 Updating stored procedures...');
    
    const sqlFile = path.join(__dirname, 'FIX_EMAIL_LOGIN_PROCEDURES.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');
    
    // Split by DELIMITER and execute
    const statements = sql
      .replace(/DELIMITER \$\$/g, '')
      .replace(/DELIMITER ;/g, '')
      .replace(/\$\$/g, ';')
      .split(/;\s*(?=DROP PROCEDURE|CREATE PROCEDURE|SELECT)/i)
      .filter(s => s.trim());
    
    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (trimmed && !trimmed.startsWith('--')) {
        try {
          await connection.execute(trimmed);
          // Extract procedure name for logging
          const match = trimmed.match(/PROCEDURE\s+(?:IF EXISTS\s+)?`?(\w+)`?/i);
          if (match) {
            console.log(`  ✅ ${match[1]}`);
          }
        } catch (err) {
          if (!err.message.includes('already exists')) {
            console.error(`  ❌ Error: ${err.message}`);
          }
        }
      }
    }
    
    // Verify procedures
    console.log('\n📋 Verifying procedures...');
    const [procs] = await connection.execute(`
      SELECT ROUTINE_NAME 
      FROM information_schema.ROUTINES 
      WHERE ROUTINE_SCHEMA = ? 
      AND ROUTINE_NAME IN (
        'getInspectorsByBranch',
        'getAllInspectors',
        'getCollectorsByBranch',
        'getAllCollectors',
        'createBusinessEmployee',
        'getAllBusinessEmployees',
        'createInspector',
        'createCollector'
      )
      ORDER BY ROUTINE_NAME
    `, [dbConfig.database]);
    
    console.log('Stored procedures ready:');
    procs.forEach(p => console.log(`  ✅ ${p.ROUTINE_NAME}`));
    
    console.log('\n✅ All procedures updated successfully!');
    console.log('🔄 Please restart your backend servers.');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) await connection.end();
  }
}

runFix();
