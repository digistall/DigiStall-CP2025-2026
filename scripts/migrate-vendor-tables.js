import { createConnection } from '../config/database.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigration() {
  let connection
  try {
    console.log('🔄 Running vendor applicant tables migration...')
    connection = await createConnection()

    // Create vendor_account table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vendor_account (
        vendor_account_id INT NOT NULL AUTO_INCREMENT,
        vendor_id INT NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        status ENUM('active','inactive') DEFAULT 'active',
        last_login DATETIME DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (vendor_account_id),
        UNIQUE KEY uq_vendor_account_email (email),
        KEY idx_vendor_account_vendor_id (vendor_id),
        CONSTRAINT fk_vendor_account_vendor
          FOREIGN KEY (vendor_id) REFERENCES vendor(vendor_id)
          ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `)
    console.log('✅ vendor_account table ready')

    // Create vendor_applicant table
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS vendor_applicant (
        vendor_applicant_id INT NOT NULL AUTO_INCREMENT,
        first_name VARCHAR(100) NOT NULL,
        middle_name VARCHAR(100) DEFAULT NULL,
        last_name VARCHAR(100) NOT NULL,
        suffix VARCHAR(10) DEFAULT NULL,
        contact_number VARCHAR(20) NOT NULL,
        email VARCHAR(255) NOT NULL,
        birthdate DATE DEFAULT NULL,
        gender VARCHAR(20) DEFAULT NULL,
        address TEXT DEFAULT NULL,
        civil_status VARCHAR(20) DEFAULT NULL,
        business_name VARCHAR(150) NOT NULL,
        business_type VARCHAR(100) NOT NULL,
        business_description TEXT DEFAULT NULL,
        products TEXT DEFAULT NULL,
        application_status ENUM('pending','approved','rejected') DEFAULT 'pending',
        decline_reason TEXT DEFAULT NULL,
        approved_at DATETIME DEFAULT NULL,
        rejected_at DATETIME DEFAULT NULL,
        vendor_id INT DEFAULT NULL,
        vendor_account_id INT DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (vendor_applicant_id),
        UNIQUE KEY uq_vendor_applicant_email (email),
        KEY idx_vendor_applicant_status (application_status),
        KEY idx_vendor_applicant_vendor (vendor_id),
        KEY idx_vendor_applicant_account (vendor_account_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
    `)
    console.log('✅ vendor_applicant table ready')

    console.log('🎉 Migration complete!')
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    if (connection) await connection.end()
    process.exit(0)
  }
}

runMigration()
