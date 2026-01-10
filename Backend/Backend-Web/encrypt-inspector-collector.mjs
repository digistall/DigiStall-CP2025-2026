// Script to encrypt Inspector & Collector data using app-level encryption
// Same format as applicant table: iv:authTag:data (base64 strings)
import mysql from 'mysql2/promise';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent Backend folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// App encryption functions (same as encryptionService.js)
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;

const getEncryptionKey = () => {
  const key = process.env.DATA_ENCRYPTION_KEY;
  if (!key) {
    return crypto.scryptSync('digistall-secure-key-change-in-production', 'salt', 32);
  }
  return crypto.scryptSync(key, 'digistall-salt', 32);
};

const encryptData = (plainText) => {
  if (!plainText || plainText === '') return plainText;
  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag();
    return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
  } catch (error) {
    console.error('Encryption error:', error.message);
    return plainText;
  }
};

async function encryptInspectorCollectorData() {
  // Check if using cloud database
  const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com');
  
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectTimeout: 60000,
    ...(isCloudDB && {
      ssl: { rejectUnauthorized: false }
    })
  });

  try {
    console.log('✅ Connected to database');
    console.log('🔐 Using encryption key from environment\n');

    // ============================================
    // ENCRYPT INSPECTOR TABLE
    // ============================================
    console.log('========================================');
    console.log('ENCRYPTING INSPECTOR TABLE');
    console.log('========================================\n');

    // Inspector data to encrypt
    const inspectors = [
      {
        username: 'INS4526',
        first_name: 'Test',
        last_name: 'Inspector',
        email: 'testinspector@example.com',
        contact_no: '09876543289'
      },
      {
        username: 'INS1731',
        first_name: 'Jonas',
        last_name: 'Laurente',
        email: 'jonas@example.com',
        contact_no: '09876543285'
      },
      {
        username: 'INS2775',
        first_name: 'Shaikim',
        last_name: 'Lu',
        email: 'shaikim@example.com',
        contact_no: '09876543223'
      }
    ];

    for (const inspector of inspectors) {
      const encFirstName = encryptData(inspector.first_name);
      const encLastName = encryptData(inspector.last_name);
      const encEmail = encryptData(inspector.email);
      const encContactNo = encryptData(inspector.contact_no);

      await connection.execute(`
        UPDATE inspector 
        SET 
          first_name = ?,
          last_name = ?,
          email = ?,
          contact_no = ?,
          is_encrypted = 1
        WHERE username = ?
      `, [encFirstName, encLastName, encEmail, encContactNo, inspector.username]);

      console.log(`✅ Inspector ${inspector.username} (${inspector.first_name} ${inspector.last_name})`);
      console.log(`   First Name: ${encFirstName.substring(0, 50)}...`);
      console.log(`   Last Name:  ${encLastName.substring(0, 50)}...`);
      console.log(`   Email:      ${encEmail.substring(0, 50)}...`);
      console.log(`   Contact:    ${encContactNo.substring(0, 50)}...\n`);
    }

    // ============================================
    // ENCRYPT COLLECTOR TABLE
    // ============================================
    console.log('========================================');
    console.log('ENCRYPTING COLLECTOR TABLE');
    console.log('========================================\n');

    // Collector data to encrypt
    const collectors = [
      {
        username: 'COL3126',
        first_name: 'Jeno Aldrei',
        last_name: 'Laurente',
        email: 'laurentejeno73@gmail.com',
        contact_no: '09473430196'
      },
      {
        username: 'COL6386',
        first_name: 'Giuseppe',
        last_name: 'Arnaldo',
        email: 'archividox76@gmail.com',
        contact_no: '09352013057'
      }
    ];

    for (const collector of collectors) {
      const encFirstName = encryptData(collector.first_name);
      const encLastName = encryptData(collector.last_name);
      const encEmail = encryptData(collector.email);
      const encContactNo = encryptData(collector.contact_no);

      await connection.execute(`
        UPDATE collector 
        SET 
          first_name = ?,
          last_name = ?,
          email = ?,
          contact_no = ?,
          is_encrypted = 1
        WHERE username = ?
      `, [encFirstName, encLastName, encEmail, encContactNo, collector.username]);

      console.log(`✅ Collector ${collector.username} (${collector.first_name} ${collector.last_name})`);
      console.log(`   First Name: ${encFirstName.substring(0, 50)}...`);
      console.log(`   Last Name:  ${encLastName.substring(0, 50)}...`);
      console.log(`   Email:      ${encEmail.substring(0, 50)}...`);
      console.log(`   Contact:    ${encContactNo.substring(0, 50)}...\n`);
    }

    // ============================================
    // VERIFICATION
    // ============================================
    console.log('========================================');
    console.log('VERIFICATION');
    console.log('========================================\n');

    const [inspectorRows] = await connection.execute(`
      SELECT username, first_name, last_name, email, contact_no, is_encrypted 
      FROM inspector 
      ORDER BY inspector_id
    `);

    console.log('INSPECTOR TABLE:');
    inspectorRows.forEach(row => {
      console.log(`  ${row.username}: is_encrypted=${row.is_encrypted}`);
      console.log(`    first_name: ${row.first_name ? row.first_name.substring(0, 60) + '...' : 'NULL'}`);
      console.log(`    last_name:  ${row.last_name ? row.last_name.substring(0, 60) + '...' : 'NULL'}`);
    });

    const [collectorRows] = await connection.execute(`
      SELECT username, first_name, last_name, email, contact_no, is_encrypted 
      FROM collector 
      ORDER BY collector_id
    `);

    console.log('\nCOLLECTOR TABLE:');
    collectorRows.forEach(row => {
      console.log(`  ${row.username}: is_encrypted=${row.is_encrypted}`);
      console.log(`    first_name: ${row.first_name ? row.first_name.substring(0, 60) + '...' : 'NULL'}`);
      console.log(`    last_name:  ${row.last_name ? row.last_name.substring(0, 60) + '...' : 'NULL'}`);
    });

    console.log('\n========================================');
    console.log('✅ ENCRYPTION COMPLETED SUCCESSFULLY!');
    console.log('========================================');
    console.log('\nInspector and Collector data is now encrypted like Applicant table');
    console.log('Data is stored as base64 strings (iv:authTag:data format)');
    console.log('Your backend will decrypt this data when retrieved\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await connection.end();
    console.log('✅ Database connection closed');
  }
}

// Run the script
encryptInspectorCollectorData();
