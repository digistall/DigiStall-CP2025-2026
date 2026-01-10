// Script to re-encrypt data using application's encryption format
// This converts database AES encrypted BLOBs to app-level encryption (iv:authTag:data base64)
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

async function reEncryptAllData() {
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

    // Get database encryption key
    const [keyRows] = await connection.execute(
      "SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1"
    );
    const dbEncKey = keyRows[0]?.encryption_key;
    console.log('✅ Database encryption key found');

    // ============================================
    // RE-ENCRYPT APPLICANT TABLE
    // ============================================
    console.log('\n========================================');
    console.log('RE-ENCRYPTING APPLICANT TABLE');
    console.log('========================================');

    // Get all applicants with encrypted BLOB data
    const [applicants] = await connection.execute(`
      SELECT 
        applicant_id,
        CAST(AES_DECRYPT(encrypted_full_name, ?) AS CHAR(255)) as decrypted_name,
        CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) as decrypted_contact,
        CAST(AES_DECRYPT(encrypted_address, ?) AS CHAR(500)) as decrypted_address,
        CAST(AES_DECRYPT(encrypted_email, ?) AS CHAR(255)) as decrypted_email
      FROM applicant 
      WHERE is_encrypted = 1 AND encrypted_full_name IS NOT NULL
    `, [dbEncKey, dbEncKey, dbEncKey, dbEncKey]);

    console.log(`Found ${applicants.length} applicants with encrypted data`);

    for (const app of applicants) {
      const encName = encryptData(app.decrypted_name);
      const encContact = encryptData(app.decrypted_contact);
      const encAddress = encryptData(app.decrypted_address);

      await connection.execute(`
        UPDATE applicant 
        SET applicant_full_name = ?, applicant_contact_number = ?, applicant_address = ?
        WHERE applicant_id = ?
      `, [encName, encContact, encAddress, app.applicant_id]);

      // Update email in other_information
      if (app.decrypted_email) {
        const encEmail = encryptData(app.decrypted_email);
        await connection.execute(`
          UPDATE other_information SET email_address = ? WHERE applicant_id = ?
        `, [encEmail, app.applicant_id]);
      }

      console.log(`  ✅ Applicant #${app.applicant_id}: ${app.decrypted_name} -> ${encName.substring(0, 30)}...`);
    }

    // ============================================
    // RE-ENCRYPT BUSINESS_EMPLOYEE TABLE
    // ============================================
    console.log('\n========================================');
    console.log('RE-ENCRYPTING BUSINESS_EMPLOYEE TABLE');
    console.log('========================================');

    const [employees] = await connection.execute(`
      SELECT 
        employee_id,
        CAST(AES_DECRYPT(encrypted_first_name, ?) AS CHAR(100)) as decrypted_first,
        CAST(AES_DECRYPT(encrypted_last_name, ?) AS CHAR(100)) as decrypted_last,
        CAST(AES_DECRYPT(encrypted_email, ?) AS CHAR(255)) as decrypted_email,
        CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) as decrypted_contact
      FROM business_employee 
      WHERE is_encrypted = 1 AND encrypted_first_name IS NOT NULL
    `, [dbEncKey, dbEncKey, dbEncKey, dbEncKey]);

    console.log(`Found ${employees.length} employees with encrypted data`);

    for (const emp of employees) {
      const encFirst = encryptData(emp.decrypted_first);
      const encLast = encryptData(emp.decrypted_last);
      const encEmail = encryptData(emp.decrypted_email);
      const encContact = encryptData(emp.decrypted_contact);

      await connection.execute(`
        UPDATE business_employee 
        SET first_name = ?, last_name = ?, email = ?, contact_number = ?
        WHERE employee_id = ?
      `, [encFirst, encLast, encEmail, encContact, emp.employee_id]);

      console.log(`  ✅ Employee #${emp.employee_id}: ${emp.decrypted_first} ${emp.decrypted_last}`);
    }

    // ============================================
    // RE-ENCRYPT BUSINESS_MANAGER TABLE
    // ============================================
    console.log('\n========================================');
    console.log('RE-ENCRYPTING BUSINESS_MANAGER TABLE');
    console.log('========================================');

    const [managers] = await connection.execute(`
      SELECT 
        business_manager_id,
        CAST(AES_DECRYPT(encrypted_first_name, ?) AS CHAR(100)) as decrypted_first,
        CAST(AES_DECRYPT(encrypted_last_name, ?) AS CHAR(100)) as decrypted_last,
        CAST(AES_DECRYPT(encrypted_email, ?) AS CHAR(255)) as decrypted_email,
        CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) as decrypted_contact
      FROM business_manager 
      WHERE is_encrypted = 1 AND encrypted_first_name IS NOT NULL
    `, [dbEncKey, dbEncKey, dbEncKey, dbEncKey]);

    console.log(`Found ${managers.length} managers with encrypted data`);

    for (const mgr of managers) {
      const encFirst = encryptData(mgr.decrypted_first);
      const encLast = encryptData(mgr.decrypted_last);
      const encEmail = encryptData(mgr.decrypted_email);
      const encContact = encryptData(mgr.decrypted_contact);

      await connection.execute(`
        UPDATE business_manager 
        SET first_name = ?, last_name = ?, email = ?, contact_number = ?
        WHERE business_manager_id = ?
      `, [encFirst, encLast, encEmail, encContact, mgr.business_manager_id]);

      console.log(`  ✅ Manager #${mgr.business_manager_id}: ${mgr.decrypted_first} ${mgr.decrypted_last}`);
    }

    // ============================================
    // RE-ENCRYPT STALLHOLDER TABLE
    // ============================================
    console.log('\n========================================');
    console.log('RE-ENCRYPTING STALLHOLDER TABLE');
    console.log('========================================');

    const [stallholders] = await connection.execute(`
      SELECT 
        stallholder_id,
        CAST(AES_DECRYPT(encrypted_first_name, ?) AS CHAR(100)) as decrypted_first,
        CAST(AES_DECRYPT(encrypted_last_name, ?) AS CHAR(100)) as decrypted_last,
        CAST(AES_DECRYPT(encrypted_email, ?) AS CHAR(255)) as decrypted_email,
        CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) as decrypted_contact,
        CAST(AES_DECRYPT(encrypted_address, ?) AS CHAR(500)) as decrypted_address
      FROM stallholder 
      WHERE is_encrypted = 1 AND encrypted_first_name IS NOT NULL
    `, [dbEncKey, dbEncKey, dbEncKey, dbEncKey, dbEncKey]);

    console.log(`Found ${stallholders.length} stallholders with encrypted data`);

    for (const sh of stallholders) {
      const encFirst = encryptData(sh.decrypted_first);
      const encLast = encryptData(sh.decrypted_last);
      const encEmail = encryptData(sh.decrypted_email);
      const encContact = encryptData(sh.decrypted_contact);
      const encAddress = encryptData(sh.decrypted_address);

      await connection.execute(`
        UPDATE stallholder 
        SET first_name = ?, last_name = ?, email = ?, contact_number = ?, address = ?
        WHERE stallholder_id = ?
      `, [encFirst, encLast, encEmail, encContact, encAddress, sh.stallholder_id]);

      console.log(`  ✅ Stallholder #${sh.stallholder_id}: ${sh.decrypted_first} ${sh.decrypted_last}`);
    }

    // ============================================
    // RE-ENCRYPT SPOUSE TABLE
    // ============================================
    console.log('\n========================================');
    console.log('RE-ENCRYPTING SPOUSE TABLE');
    console.log('========================================');

    // Check if spouse has encrypted columns
    const [spouseCols] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'spouse' AND COLUMN_NAME LIKE 'encrypted_%'
    `);

    if (spouseCols.length > 0) {
      const [spouses] = await connection.execute(`
        SELECT 
          spouse_id,
          applicant_id,
          CAST(AES_DECRYPT(encrypted_spouse_name, ?) AS CHAR(255)) as decrypted_name,
          CAST(AES_DECRYPT(encrypted_spouse_contact, ?) AS CHAR(50)) as decrypted_contact
        FROM spouse 
        WHERE encrypted_spouse_name IS NOT NULL
      `, [dbEncKey, dbEncKey]);

      console.log(`Found ${spouses.length} spouses with encrypted data`);

      for (const sp of spouses) {
        if (sp.decrypted_name) {
          const encName = encryptData(sp.decrypted_name);
          const encContact = sp.decrypted_contact ? encryptData(sp.decrypted_contact) : null;

          await connection.execute(`
            UPDATE spouse 
            SET spouse_full_name = ?, spouse_contact_number = ?
            WHERE spouse_id = ?
          `, [encName, encContact, sp.spouse_id]);

          console.log(`  ✅ Spouse #${sp.spouse_id}: ${sp.decrypted_name}`);
        }
      }
    } else {
      console.log('No encrypted columns in spouse table, skipping...');
    }

    // ============================================
    // VERIFICATION
    // ============================================
    console.log('\n========================================');
    console.log('VERIFICATION - Sample Data');
    console.log('========================================');

    const [verifyApplicants] = await connection.execute(
      'SELECT applicant_id, applicant_full_name, applicant_contact_number FROM applicant WHERE is_encrypted = 1 LIMIT 5'
    );
    console.log('\nApplicants (should show encrypted format like nlUsAr8bQ...):');
    verifyApplicants.forEach(a => {
      console.log(`  #${a.applicant_id}: ${a.applicant_full_name?.substring(0, 40)}...`);
    });

    console.log('\n✅ RE-ENCRYPTION COMPLETED SUCCESSFULLY!');
    console.log('All data is now in the format: iv:authTag:encryptedData (base64)');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  } finally {
    await connection.end();
  }
}

reEncryptAllData();
