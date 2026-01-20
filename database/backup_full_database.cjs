// ===== FULL DATABASE BACKUP & MIGRATION SCRIPT =====
// This script extracts ALL tables, views, stored procedures, and functions
// from the DigitalOcean database and saves them to a SQL file for restoration
//
// Usage: node backup_full_database.cjs
// Output: Creates a timestamped SQL file that can restore the entire database

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'db.cjunttcqcwlh.ap-southeast-1.rds.amazonaws.com',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'naga_stall_digitalocean',
  ssl: { rejectUnauthorized: false },
  multipleStatements: true
};

// Output configuration
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const outputFile = path.join(__dirname, `FULL_DATABASE_BACKUP_${timestamp}.sql`);
const summaryFile = path.join(__dirname, `DATABASE_SUMMARY_${timestamp}.txt`);

async function backupDatabase() {
  let connection;
  let sqlContent = [];
  let summary = [];

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('   FULL DATABASE BACKUP & MIGRATION SCRIPT');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`📅 Timestamp: ${new Date().toISOString()}`);
  console.log(`🗄️  Database: ${dbConfig.database}`);
  console.log(`🌐 Host: ${dbConfig.host}`);
  console.log('');

  try {
    // Connect to database
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected successfully!\n');

    // Add header to SQL file
    sqlContent.push(`-- ═══════════════════════════════════════════════════════════════════════`);
    sqlContent.push(`-- FULL DATABASE BACKUP - ${dbConfig.database}`);
    sqlContent.push(`-- Generated: ${new Date().toISOString()}`);
    sqlContent.push(`-- Source: ${dbConfig.host}`);
    sqlContent.push(`-- `);
    sqlContent.push(`-- INSTRUCTIONS:`);
    sqlContent.push(`-- 1. Create a new database: CREATE DATABASE naga_stall;`);
    sqlContent.push(`-- 2. USE naga_stall;`);
    sqlContent.push(`-- 3. Run this entire script`);
    sqlContent.push(`-- ═══════════════════════════════════════════════════════════════════════`);
    sqlContent.push('');
    sqlContent.push('SET FOREIGN_KEY_CHECKS = 0;');
    sqlContent.push('SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";');
    sqlContent.push('SET time_zone = "+08:00";');
    sqlContent.push('SET NAMES utf8mb4;');
    sqlContent.push('');

    summary.push('════════════════════════════════════════════════════════════════');
    summary.push('DATABASE STRUCTURE SUMMARY');
    summary.push(`Exported: ${new Date().toISOString()}`);
    summary.push('════════════════════════════════════════════════════════════════');
    summary.push('');

    // ===== 1. BACKUP TABLES =====
    console.log('📋 STEP 1: Extracting Tables...');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('-- TABLES');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('');

    const [tables] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.TABLES 
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'
       ORDER BY TABLE_NAME`,
      [dbConfig.database]
    );

    summary.push('TABLES:');
    console.log(`   Found ${tables.length} tables`);

    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      process.stdout.write(`   - ${tableName}... `);

      // Get CREATE TABLE statement
      const [createTable] = await connection.execute(`SHOW CREATE TABLE \`${tableName}\``);
      const createStatement = createTable[0]['Create Table'];

      // Get row count
      const [countResult] = await connection.execute(`SELECT COUNT(*) as cnt FROM \`${tableName}\``);
      const rowCount = countResult[0].cnt;

      sqlContent.push(`-- Table: ${tableName} (${rowCount} rows)`);
      sqlContent.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
      sqlContent.push(createStatement + ';');
      sqlContent.push('');

      // Get table data if not empty
      if (rowCount > 0) {
        const [rows] = await connection.execute(`SELECT * FROM \`${tableName}\``);
        if (rows.length > 0) {
          const columns = Object.keys(rows[0]);
          const columnList = columns.map(c => `\`${c}\``).join(', ');

          // Build INSERT statements in batches of 100
          const batchSize = 100;
          for (let i = 0; i < rows.length; i += batchSize) {
            const batch = rows.slice(i, i + batchSize);
            const values = batch.map(row => {
              const vals = columns.map(col => {
                const val = row[col];
                if (val === null) return 'NULL';
                if (typeof val === 'number') return val;
                if (val instanceof Date) return `'${val.toISOString().slice(0, 19).replace('T', ' ')}'`;
                if (Buffer.isBuffer(val)) return `X'${val.toString('hex')}'`;
                return `'${String(val).replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
              });
              return `(${vals.join(', ')})`;
            });
            sqlContent.push(`INSERT INTO \`${tableName}\` (${columnList}) VALUES`);
            sqlContent.push(values.join(',\n') + ';');
          }
          sqlContent.push('');
        }
      }

      summary.push(`  - ${tableName} (${rowCount} rows)`);
      console.log(`${rowCount} rows ✅`);
    }
    summary.push('');

    // ===== 2. BACKUP VIEWS =====
    console.log('\n📋 STEP 2: Extracting Views...');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('-- VIEWS');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('');

    const [views] = await connection.execute(
      `SELECT TABLE_NAME FROM information_schema.VIEWS 
       WHERE TABLE_SCHEMA = ?
       ORDER BY TABLE_NAME`,
      [dbConfig.database]
    );

    summary.push('VIEWS:');
    console.log(`   Found ${views.length} views`);

    for (const view of views) {
      const viewName = view.TABLE_NAME;
      process.stdout.write(`   - ${viewName}... `);

      const [createView] = await connection.execute(`SHOW CREATE VIEW \`${viewName}\``);
      let createStatement = createView[0]['Create View'];
      
      // Clean up the DEFINER clause for portability
      createStatement = createStatement.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '');

      sqlContent.push(`-- View: ${viewName}`);
      sqlContent.push(`DROP VIEW IF EXISTS \`${viewName}\`;`);
      sqlContent.push(createStatement + ';');
      sqlContent.push('');

      summary.push(`  - ${viewName}`);
      console.log('✅');
    }
    summary.push('');

    // ===== 3. BACKUP STORED PROCEDURES =====
    console.log('\n📋 STEP 3: Extracting Stored Procedures...');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('-- STORED PROCEDURES');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('');

    const [procedures] = await connection.execute(
      `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
       WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'PROCEDURE'
       ORDER BY ROUTINE_NAME`,
      [dbConfig.database]
    );

    summary.push('STORED PROCEDURES:');
    console.log(`   Found ${procedures.length} stored procedures`);

    sqlContent.push('DELIMITER $$');
    sqlContent.push('');

    for (const proc of procedures) {
      const procName = proc.ROUTINE_NAME;
      process.stdout.write(`   - ${procName}... `);

      try {
        const [createProc] = await connection.execute(`SHOW CREATE PROCEDURE \`${procName}\``);
        let createStatement = createProc[0]['Create Procedure'];
        
        if (createStatement) {
          // Clean up DEFINER clause
          createStatement = createStatement.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '');

          sqlContent.push(`-- Procedure: ${procName}`);
          sqlContent.push(`DROP PROCEDURE IF EXISTS \`${procName}\`$$`);
          sqlContent.push(createStatement + '$$');
          sqlContent.push('');

          summary.push(`  - ${procName}`);
          console.log('✅');
        } else {
          console.log('⚠️ No create statement');
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
      }
    }

    sqlContent.push('DELIMITER ;');
    sqlContent.push('');
    summary.push('');

    // ===== 4. BACKUP FUNCTIONS =====
    console.log('\n📋 STEP 4: Extracting Functions...');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('-- FUNCTIONS');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('');

    const [functions] = await connection.execute(
      `SELECT ROUTINE_NAME FROM information_schema.ROUTINES 
       WHERE ROUTINE_SCHEMA = ? AND ROUTINE_TYPE = 'FUNCTION'
       ORDER BY ROUTINE_NAME`,
      [dbConfig.database]
    );

    summary.push('FUNCTIONS:');
    console.log(`   Found ${functions.length} functions`);

    sqlContent.push('DELIMITER $$');
    sqlContent.push('');

    for (const func of functions) {
      const funcName = func.ROUTINE_NAME;
      process.stdout.write(`   - ${funcName}... `);

      try {
        const [createFunc] = await connection.execute(`SHOW CREATE FUNCTION \`${funcName}\``);
        let createStatement = createFunc[0]['Create Function'];
        
        if (createStatement) {
          // Clean up DEFINER clause
          createStatement = createStatement.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '');

          sqlContent.push(`-- Function: ${funcName}`);
          sqlContent.push(`DROP FUNCTION IF EXISTS \`${funcName}\`$$`);
          sqlContent.push(createStatement + '$$');
          sqlContent.push('');

          summary.push(`  - ${funcName}`);
          console.log('✅');
        } else {
          console.log('⚠️ No create statement');
        }
      } catch (err) {
        console.log(`❌ Error: ${err.message}`);
      }
    }

    sqlContent.push('DELIMITER ;');
    sqlContent.push('');
    summary.push('');

    // ===== 5. BACKUP TRIGGERS =====
    console.log('\n📋 STEP 5: Extracting Triggers...');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('-- TRIGGERS');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('');

    const [triggers] = await connection.execute(
      `SELECT TRIGGER_NAME FROM information_schema.TRIGGERS 
       WHERE TRIGGER_SCHEMA = ?
       ORDER BY TRIGGER_NAME`,
      [dbConfig.database]
    );

    summary.push('TRIGGERS:');
    console.log(`   Found ${triggers.length} triggers`);

    if (triggers.length > 0) {
      sqlContent.push('DELIMITER $$');
      sqlContent.push('');

      for (const trigger of triggers) {
        const triggerName = trigger.TRIGGER_NAME;
        process.stdout.write(`   - ${triggerName}... `);

        try {
          const [createTrigger] = await connection.execute(`SHOW CREATE TRIGGER \`${triggerName}\``);
          let createStatement = createTrigger[0]['SQL Original Statement'];
          
          if (createStatement) {
            // Clean up DEFINER clause
            createStatement = createStatement.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '');

            sqlContent.push(`-- Trigger: ${triggerName}`);
            sqlContent.push(`DROP TRIGGER IF EXISTS \`${triggerName}\`$$`);
            sqlContent.push(createStatement + '$$');
            sqlContent.push('');

            summary.push(`  - ${triggerName}`);
            console.log('✅');
          }
        } catch (err) {
          console.log(`❌ Error: ${err.message}`);
        }
      }

      sqlContent.push('DELIMITER ;');
    } else {
      summary.push('  (none)');
      console.log('   No triggers found');
    }
    sqlContent.push('');
    summary.push('');

    // ===== 6. BACKUP EVENTS =====
    console.log('\n📋 STEP 6: Extracting Events...');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('-- EVENTS');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('');

    const [events] = await connection.execute(
      `SELECT EVENT_NAME FROM information_schema.EVENTS 
       WHERE EVENT_SCHEMA = ?
       ORDER BY EVENT_NAME`,
      [dbConfig.database]
    );

    summary.push('EVENTS:');
    console.log(`   Found ${events.length} events`);

    if (events.length > 0) {
      sqlContent.push('DELIMITER $$');
      sqlContent.push('');

      for (const event of events) {
        const eventName = event.EVENT_NAME;
        process.stdout.write(`   - ${eventName}... `);

        try {
          const [createEvent] = await connection.execute(`SHOW CREATE EVENT \`${eventName}\``);
          let createStatement = createEvent[0]['Create Event'];
          
          if (createStatement) {
            // Clean up DEFINER clause
            createStatement = createStatement.replace(/DEFINER=`[^`]+`@`[^`]+`\s*/g, '');

            sqlContent.push(`-- Event: ${eventName}`);
            sqlContent.push(`DROP EVENT IF EXISTS \`${eventName}\`$$`);
            sqlContent.push(createStatement + '$$');
            sqlContent.push('');

            summary.push(`  - ${eventName}`);
            console.log('✅');
          }
        } catch (err) {
          console.log(`❌ Error: ${err.message}`);
        }
      }

      sqlContent.push('DELIMITER ;');
    } else {
      summary.push('  (none)');
      console.log('   No events found');
    }
    sqlContent.push('');
    summary.push('');

    // Add footer
    sqlContent.push('SET FOREIGN_KEY_CHECKS = 1;');
    sqlContent.push('');
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');
    sqlContent.push('-- BACKUP COMPLETE');
    sqlContent.push(`-- Generated: ${new Date().toISOString()}`);
    sqlContent.push('-- ═══════════════════════════════════════════════════════════════════════');

    // Write files
    console.log('\n💾 Writing backup files...');
    
    const sqlOutput = sqlContent.join('\n');
    fs.writeFileSync(outputFile, sqlOutput, 'utf8');
    console.log(`   ✅ SQL Backup: ${outputFile}`);
    console.log(`      Size: ${(sqlOutput.length / 1024 / 1024).toFixed(2)} MB`);

    const summaryOutput = summary.join('\n');
    fs.writeFileSync(summaryFile, summaryOutput, 'utf8');
    console.log(`   ✅ Summary: ${summaryFile}`);

    // Print summary
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('   BACKUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`   📊 Tables: ${tables.length}`);
    console.log(`   👁️  Views: ${views.length}`);
    console.log(`   🔧 Stored Procedures: ${procedures.length}`);
    console.log(`   📐 Functions: ${functions.length}`);
    console.log(`   ⚡ Triggers: ${triggers.length}`);
    console.log(`   📅 Events: ${events.length}`);
    console.log('');
    console.log('   📄 Output Files:');
    console.log(`      - ${path.basename(outputFile)}`);
    console.log(`      - ${path.basename(summaryFile)}`);
    console.log('');
    console.log('   💡 To restore this backup:');
    console.log('      1. Create a new database');
    console.log('      2. mysql -u user -p database_name < backup_file.sql');
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

// Run the backup
backupDatabase();
