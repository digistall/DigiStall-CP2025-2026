/**
 * Seed script: Create a vendor_account for vendor_id 1 (Jovel Portuguez Jr.)
 * 
 * Email: jovel@email.com
 * Password: vendor123
 * 
 * Run: node seedVendorAccount.js
 */

import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import dotenv from 'dotenv'

dotenv.config()

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT) || 25060,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'naga_stall',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
}

async function seed() {
  let connection
  try {
    connection = await mysql.createConnection(dbConfig)
    console.log('Connected to database')

    const vendorId = 1
    const email = 'jovel@email.com'
    const plainPassword = 'vendor123'

    // Check if account already exists
    const [existing] = await connection.execute(
      'SELECT vendor_account_id FROM vendor_account WHERE LOWER(vendor_email) = ? LIMIT 1',
      [email.toLowerCase()]
    )

    if (existing.length > 0) {
      console.log('Vendor account already exists for', email)
      console.log('vendor_account_id:', existing[0].vendor_account_id)
      return
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(plainPassword, 10)

    // Insert vendor account
    const [result] = await connection.execute(
      `INSERT INTO vendor_account (vendor_id, vendor_email, vendor_password_hash)
       VALUES (?, ?, ?)`,
      [vendorId, email, passwordHash]
    )

    console.log('Vendor account created successfully!')
    console.log('')
    console.log('  vendor_account_id:', result.insertId)
    console.log('  vendor_id:', vendorId)
    console.log('  email:', email)
    console.log('  password:', plainPassword)
    console.log('')
    console.log('Use these credentials to log in on mobile:')
    console.log('  Email: jovel@email.com')
    console.log('  Password: vendor123')

  } catch (error) {
    console.log('ERROR:', error.message)
    console.log('CODE:', error.code)
  } finally {
    if (connection) await connection.end()
  }
}

seed()
