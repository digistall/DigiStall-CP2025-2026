// Script to decrypt masked data from encrypted BLOB columns
const mysql = require('mysql2/promise');
require('dotenv').config();

async function decryptMaskedData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true }
  });

  try {
    console.log('Connected to database');

    // Get encryption key
    const [keyRows] = await connection.execute(
      "SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1"
    );
    const encKey = keyRows[0]?.encryption_key;
    console.log('Encryption key found:', encKey ? 'Yes' : 'No');

    if (!encKey) {
      console.log('No encryption key found!');
      return;
    }

    // ============================================
    // UPDATE APPLICANT TABLE
    // ============================================
    console.log('\n--- Updating APPLICANT table ---');
    const [applicantResult] = await connection.execute(`
      UPDATE applicant 
      SET 
        applicant_full_name = CASE 
          WHEN is_encrypted = 1 AND encrypted_full_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_full_name, ?) AS CHAR(255))
          ELSE applicant_full_name 
        END,
        applicant_contact_number = CASE 
          WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50))
          ELSE applicant_contact_number 
        END,
        applicant_address = CASE 
          WHEN is_encrypted = 1 AND encrypted_address IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_address, ?) AS CHAR(500))
          ELSE applicant_address 
        END
      WHERE is_encrypted = 1 AND encrypted_full_name IS NOT NULL
    `, [encKey, encKey, encKey]);
    console.log('Applicants updated:', applicantResult.affectedRows);

    // Update email in other_information table
    console.log('\n--- Updating OTHER_INFORMATION table (email) ---');
    const [emailResult] = await connection.execute(`
      UPDATE other_information oi
      INNER JOIN applicant a ON oi.applicant_id = a.applicant_id
      SET oi.email_address = CAST(AES_DECRYPT(a.encrypted_email, ?) AS CHAR(255))
      WHERE a.is_encrypted = 1 AND a.encrypted_email IS NOT NULL
    `, [encKey]);
    console.log('Email addresses updated:', emailResult.affectedRows);

    // ============================================
    // UPDATE SPOUSE TABLE
    // ============================================
    console.log('\n--- Checking SPOUSE table ---');
    // Check if spouse has encrypted columns
    const [spouseCols] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'spouse' AND COLUMN_NAME LIKE 'encrypted_%'
    `);
    if (spouseCols.length > 0) {
      console.log('Spouse encrypted columns:', spouseCols.map(c => c.COLUMN_NAME).join(', '));
      // Update spouse if it has encrypted columns
      const [spouseResult] = await connection.execute(`
        UPDATE spouse 
        SET 
          spouse_full_name = CASE 
            WHEN encrypted_spouse_name IS NOT NULL THEN 
              CAST(AES_DECRYPT(encrypted_spouse_name, ?) AS CHAR(255))
            ELSE spouse_full_name 
          END,
          spouse_contact_number = CASE 
            WHEN encrypted_spouse_contact IS NOT NULL THEN 
              CAST(AES_DECRYPT(encrypted_spouse_contact, ?) AS CHAR(50))
            ELSE spouse_contact_number 
          END
        WHERE encrypted_spouse_name IS NOT NULL
      `, [encKey, encKey]);
      console.log('Spouse records updated:', spouseResult.affectedRows);
    } else {
      console.log('No encrypted columns in spouse table');
    }

    // ============================================
    // UPDATE BUSINESS_EMPLOYEE TABLE
    // ============================================
    console.log('\n--- Updating BUSINESS_EMPLOYEE table ---');
    const [empCols] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_employee' AND COLUMN_NAME = 'is_encrypted'
    `);
    if (empCols.length > 0) {
      const [empResult] = await connection.execute(`
        UPDATE business_employee 
        SET 
          first_name = CASE WHEN is_encrypted = 1 AND encrypted_first_name IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_first_name, ?) AS CHAR(100)) ELSE first_name END,
          last_name = CASE WHEN is_encrypted = 1 AND encrypted_last_name IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_last_name, ?) AS CHAR(100)) ELSE last_name END,
          email = CASE WHEN is_encrypted = 1 AND encrypted_email IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_email, ?) AS CHAR(255)) ELSE email END,
          contact_number = CASE WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) ELSE contact_number END
        WHERE is_encrypted = 1
      `, [encKey, encKey, encKey, encKey]);
      console.log('Business employees updated:', empResult.affectedRows);
    } else {
      console.log('No is_encrypted column in business_employee table');
    }

    // ============================================
    // UPDATE BUSINESS_MANAGER TABLE
    // ============================================
    console.log('\n--- Updating BUSINESS_MANAGER table ---');
    const [mgrCols] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_manager' AND COLUMN_NAME = 'is_encrypted'
    `);
    if (mgrCols.length > 0) {
      const [mgrResult] = await connection.execute(`
        UPDATE business_manager 
        SET 
          first_name = CASE WHEN is_encrypted = 1 AND encrypted_first_name IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_first_name, ?) AS CHAR(100)) ELSE first_name END,
          last_name = CASE WHEN is_encrypted = 1 AND encrypted_last_name IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_last_name, ?) AS CHAR(100)) ELSE last_name END,
          email = CASE WHEN is_encrypted = 1 AND encrypted_email IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_email, ?) AS CHAR(255)) ELSE email END,
          contact_number = CASE WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) ELSE contact_number END
        WHERE is_encrypted = 1
      `, [encKey, encKey, encKey, encKey]);
      console.log('Business managers updated:', mgrResult.affectedRows);
    } else {
      console.log('No is_encrypted column in business_manager table');
    }

    // ============================================
    // UPDATE STALLHOLDER TABLE
    // ============================================
    console.log('\n--- Updating STALLHOLDER table ---');
    const [shCols] = await connection.execute(`
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'stallholder' AND COLUMN_NAME = 'is_encrypted'
    `);
    if (shCols.length > 0) {
      const [shResult] = await connection.execute(`
        UPDATE stallholder 
        SET 
          first_name = CASE WHEN is_encrypted = 1 AND encrypted_first_name IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_first_name, ?) AS CHAR(100)) ELSE first_name END,
          last_name = CASE WHEN is_encrypted = 1 AND encrypted_last_name IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_last_name, ?) AS CHAR(100)) ELSE last_name END,
          email = CASE WHEN is_encrypted = 1 AND encrypted_email IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_email, ?) AS CHAR(255)) ELSE email END,
          contact_number = CASE WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_contact, ?) AS CHAR(50)) ELSE contact_number END,
          address = CASE WHEN is_encrypted = 1 AND encrypted_address IS NOT NULL THEN CAST(AES_DECRYPT(encrypted_address, ?) AS CHAR(500)) ELSE address END
        WHERE is_encrypted = 1
      `, [encKey, encKey, encKey, encKey, encKey]);
      console.log('Stallholders updated:', shResult.affectedRows);
    } else {
      console.log('No is_encrypted column in stallholder table');
    }

    // ============================================
    // VERIFY RESULTS
    // ============================================
    console.log('\n========================================');
    console.log('VERIFICATION - Applicants after update:');
    console.log('========================================');
    const [applicants] = await connection.execute(
      'SELECT applicant_id, applicant_full_name, applicant_contact_number, applicant_address FROM applicant ORDER BY applicant_id'
    );
    applicants.forEach(a => {
      console.log(`  #${String(a.applicant_id).padStart(4, '0')}: ${a.applicant_full_name} | ${a.applicant_contact_number} | ${a.applicant_address}`);
    });

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

decryptMaskedData();
