import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
  console.log('Connecting to database...');
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // 1. Add gender column to applicant table
    console.log('Adding gender column to applicant table...');
    await connection.execute(
      `ALTER TABLE applicant ADD COLUMN gender VARCHAR(20) NOT NULL DEFAULT 'Not Specified'`
    ).then(() => {
      console.log('✅ Gender column added successfully or already exists.');
    }).catch(e => {
      if (e.message.includes('duplicate column') || e.message.includes('already exists') || e.code === 'ER_DUP_FIELDNAME') {
        console.log('✅ Gender column already exists.');
      } else {
        console.error('❌ Failed to add gender column:', e.message);
        throw e;
      }
    });

    // 2. Drop and recreate createApplicantComplete stored procedure
    console.log('Recreating stored procedure: createApplicantComplete...');
    await connection.query(`DROP PROCEDURE IF EXISTS createApplicantComplete`);
    await connection.query(`
      CREATE PROCEDURE createApplicantComplete(
          IN p_full_name VARCHAR(500), 
          IN p_contact_number VARCHAR(500), 
          IN p_address TEXT, 
          IN p_birthdate DATE, 
          IN p_civil_status ENUM('Single','Married','Divorced','Widowed'), 
          IN p_educational_attainment VARCHAR(100), 
          IN p_nature_of_business VARCHAR(255), 
          IN p_capitalization DECIMAL(15,2), 
          IN p_source_of_capital VARCHAR(255), 
          IN p_previous_business_experience TEXT, 
          IN p_relative_stall_owner ENUM('Yes','No'), 
          IN p_spouse_full_name VARCHAR(500), 
          IN p_spouse_birthdate DATE, 
          IN p_spouse_educational_attainment VARCHAR(100), 
          IN p_spouse_contact_number VARCHAR(500), 
          IN p_spouse_occupation VARCHAR(100), 
          IN p_signature_of_applicant VARCHAR(500), 
          IN p_house_sketch_location VARCHAR(500), 
          IN p_valid_id VARCHAR(500), 
          IN p_email_address VARCHAR(255),
          IN p_gender VARCHAR(20)
      )
      BEGIN
          DECLARE new_applicant_id INT;
          DECLARE EXIT HANDLER FOR SQLEXCEPTION
          BEGIN
              ROLLBACK;
              SIGNAL SQLSTATE '45000' 
              SET MESSAGE_TEXT = 'Error creating applicant record';
          END;
          
          START TRANSACTION;
          
          -- Insert applicant (main table)
          INSERT INTO applicant (
              applicant_full_name, 
              applicant_contact_number, 
              applicant_address,
              applicant_birthdate, 
              applicant_civil_status, 
              applicant_educational_attainment,
              gender
          ) VALUES (
              p_full_name, 
              p_contact_number, 
              NULLIF(p_address, ''),
              p_birthdate, 
              COALESCE(p_civil_status, 'Single'), 
              NULLIF(p_educational_attainment, ''),
              COALESCE(p_gender, 'Not Specified')
          );
          
          SET new_applicant_id = LAST_INSERT_ID();
          
          -- Insert business information
          INSERT INTO business_information (
              applicant_id, 
              nature_of_business, 
              capitalization,
              source_of_capital, 
              previous_business_experience, 
              relative_stall_owner
          ) VALUES (
              new_applicant_id, 
              NULLIF(p_nature_of_business, ''), 
              p_capitalization,
              NULLIF(p_source_of_capital, ''), 
              NULLIF(p_previous_business_experience, ''), 
              COALESCE(p_relative_stall_owner, 'No')
          );
          
          -- Insert other information
          INSERT INTO other_information (
              applicant_id, 
              signature_of_applicant, 
              house_sketch_location, 
              valid_id, 
              email_address
          ) VALUES (
              new_applicant_id, 
              NULLIF(p_signature_of_applicant, ''), 
              NULLIF(p_house_sketch_location, ''),
              NULLIF(p_valid_id, ''), 
              p_email_address
          );
          
          -- Insert spouse information only if spouse name is provided
          IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
              INSERT INTO spouse (
                  applicant_id, 
                  spouse_full_name, 
                  spouse_birthdate,
                  spouse_educational_attainment, 
                  spouse_contact_number, 
                  spouse_occupation
              ) VALUES (
                  new_applicant_id, 
                  p_spouse_full_name, 
                  p_spouse_birthdate,
                  NULLIF(p_spouse_educational_attainment, ''), 
                  NULLIF(p_spouse_contact_number, ''), 
                  NULLIF(p_spouse_occupation, '')
              );
          END IF;
          
          COMMIT;
          
          -- Return the new applicant ID
          SELECT new_applicant_id as new_applicant_id;
      END
    `);
    console.log('✅ createApplicantComplete stored procedure recreated successfully.');

    // 3. Drop and recreate sp_get_applicants_decrypted stored procedure
    console.log('Recreating stored procedure: sp_get_applicants_decrypted...');
    await connection.query(`DROP PROCEDURE IF EXISTS sp_get_applicants_decrypted`);
    await connection.query(`
      CREATE PROCEDURE sp_get_applicants_decrypted()
      BEGIN
        DECLARE v_key VARCHAR(64);
        SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
        SELECT 
          applicant_id,
          COALESCE(fn_decrypt_value(encrypted_full_name, v_key), applicant_full_name) AS applicant_full_name,
          COALESCE(fn_decrypt_value(encrypted_email, v_key), applicant_email) AS applicant_email,
          COALESCE(fn_decrypt_value(encrypted_contact, v_key), applicant_contact_number) AS applicant_contact_number,
          COALESCE(fn_decrypt_value(encrypted_address, v_key), applicant_address) AS applicant_address,
          applicant_birthdate, applicant_civil_status,
          applicant_educational_attainment, applicant_username,
          created_at, is_encrypted, gender
        FROM applicant
        ORDER BY applicant_id DESC;
      END
    `);
    console.log('✅ sp_get_applicants_decrypted stored procedure recreated successfully.');

    // 4. Drop and recreate sp_getApplicantByIdDecrypted stored procedure
    console.log('Recreating stored procedure: sp_getApplicantByIdDecrypted...');
    await connection.query(`DROP PROCEDURE IF EXISTS sp_getApplicantByIdDecrypted`);
    await connection.query(`
      CREATE PROCEDURE sp_getApplicantByIdDecrypted(IN p_applicant_id INT)
      BEGIN
        DECLARE v_key VARCHAR(64);
        SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
        
        SELECT 
          a.applicant_id,
          COALESCE(fn_decrypt_value(a.encrypted_full_name, v_key), a.applicant_full_name) AS applicant_full_name,
          COALESCE(fn_decrypt_value(a.encrypted_email, v_key), a.applicant_email) AS applicant_email,
          COALESCE(fn_decrypt_value(a.encrypted_contact, v_key), a.applicant_contact_number) AS applicant_contact_number,
          COALESCE(fn_decrypt_value(a.encrypted_address, v_key), a.applicant_address) AS applicant_address,
          a.applicant_birthdate, a.applicant_civil_status,
          a.applicant_educational_attainment, a.applicant_username,
          a.created_at, a.gender
        FROM applicant a
        WHERE a.applicant_id = p_applicant_id;
      END
    `);
    console.log('✅ sp_getApplicantByIdDecrypted stored procedure recreated successfully.');

    console.log('\n🎉 ALL DATABASE MIGRATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
