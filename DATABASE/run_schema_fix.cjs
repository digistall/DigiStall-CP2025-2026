/**
 * Database Schema Fix Script
 * Adds missing columns and tables for DigiStall system
 * 
 * Usage: node DATABASE/run_schema_fix.cjs
 */

const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Database configuration from environment
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function runSchemaFix() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');
    
    // Add is_online column to business_manager
    console.log('\n📝 Adding is_online column to business_manager...');
    try {
      await connection.execute(`
        ALTER TABLE business_manager 
        ADD COLUMN is_online TINYINT(1) DEFAULT 0 AFTER last_login
      `);
      console.log('✅ Added is_online to business_manager');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  Column already exists in business_manager');
      } else {
        console.log('⚠️  business_manager:', e.message);
      }
    }
    
    // Add is_online column to business_employee
    console.log('\n📝 Adding is_online column to business_employee...');
    try {
      await connection.execute(`
        ALTER TABLE business_employee 
        ADD COLUMN is_online TINYINT(1) DEFAULT 0 AFTER last_login
      `);
      console.log('✅ Added is_online to business_employee');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  Column already exists in business_employee');
      } else {
        console.log('⚠️  business_employee:', e.message);
      }
    }
    
    // Add is_online column to stall_business_owner
    console.log('\n📝 Adding is_online column to stall_business_owner...');
    try {
      await connection.execute(`
        ALTER TABLE stall_business_owner 
        ADD COLUMN is_online TINYINT(1) DEFAULT 0 AFTER last_login
      `);
      console.log('✅ Added is_online to stall_business_owner');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  Column already exists in stall_business_owner');
      } else {
        console.log('⚠️  stall_business_owner:', e.message);
      }
    }
    
    // Add is_online column to system_administrator
    console.log('\n📝 Adding is_online column to system_administrator...');
    try {
      await connection.execute(`
        ALTER TABLE system_administrator 
        ADD COLUMN is_online TINYINT(1) DEFAULT 0 AFTER last_login
      `);
      console.log('✅ Added is_online to system_administrator');
    } catch (e) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  Column already exists in system_administrator');
      } else {
        console.log('⚠️  system_administrator:', e.message);
      }
    }
    
    // Create payment table if not exists
    console.log('\n📝 Creating payment table...');
    try {
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS payment (
          payment_id INT AUTO_INCREMENT PRIMARY KEY,
          stallholder_id INT NOT NULL,
          stall_id INT NOT NULL,
          amount DECIMAL(10,2) NOT NULL,
          payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          payment_method ENUM('cash', 'gcash', 'bank_transfer', 'other') DEFAULT 'cash',
          payment_type ENUM('monthly_rent', 'daily_fee', 'utility', 'penalty', 'other') DEFAULT 'monthly_rent',
          reference_number VARCHAR(100),
          status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
          notes TEXT,
          collected_by INT,
          branch_id INT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          INDEX idx_stallholder (stallholder_id),
          INDEX idx_stall (stall_id),
          INDEX idx_branch (branch_id),
          INDEX idx_payment_date (payment_date),
          INDEX idx_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ Payment table ready');
    } catch (e) {
      console.log('⚠️  Payment table:', e.message);
    }
    
    console.log('\n✅ Schema fix completed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runSchemaFix();
