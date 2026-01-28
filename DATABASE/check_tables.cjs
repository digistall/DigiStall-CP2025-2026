/**
 * Check database table structures
 * 
 * Usage: node DATABASE/check_tables.cjs
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',
  port: process.env.DB_PORT || 3306
};

async function checkTables() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database\n');
    
    // Check stallholder table structure
    console.log('📋 STALLHOLDER TABLE COLUMNS:');
    console.log('─'.repeat(50));
    const [stallholderCols] = await connection.query('DESCRIBE stallholder');
    stallholderCols.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });
    
    // Check stall table structure
    console.log('\n📋 STALL TABLE COLUMNS:');
    console.log('─'.repeat(50));
    const [stallCols] = await connection.query('DESCRIBE stall');
    stallCols.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });
    
    // Check branch table structure
    console.log('\n📋 BRANCH TABLE COLUMNS:');
    console.log('─'.repeat(50));
    const [branchCols] = await connection.query('DESCRIBE branch');
    branchCols.forEach(col => {
      console.log(`  ${col.Field} (${col.Type})`);
    });
    
    // Check payment table structure
    console.log('\n📋 PAYMENT TABLE COLUMNS:');
    console.log('─'.repeat(50));
    try {
      const [paymentCols] = await connection.query('DESCRIBE payment');
      paymentCols.forEach(col => {
        console.log(`  ${col.Field} (${col.Type})`);
      });
    } catch (e) {
      console.log('  ❌ Table does not exist');
    }
    
    // Sample data from stallholder
    console.log('\n📊 SAMPLE STALLHOLDER DATA (first row):');
    console.log('─'.repeat(50));
    const [sampleData] = await connection.query('SELECT * FROM stallholder LIMIT 1');
    if (sampleData.length > 0) {
      Object.keys(sampleData[0]).forEach(key => {
        console.log(`  ${key}: ${sampleData[0][key]}`);
      });
    } else {
      console.log('  No data in stallholder table');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkTables();
