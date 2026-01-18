const mysql = require('mysql2/promise');

async function fixCredentialSP() {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 FIXING sp_getCredentialWithApplicant\n');

    // Fix sp_getCredentialWithApplicant - remove registration table join
    console.log('Fixing sp_getCredentialWithApplicant (no registration table)...');
    await conn.query('DROP PROCEDURE IF EXISTS sp_getCredentialWithApplicant');
    await conn.query(`
      CREATE PROCEDURE sp_getCredentialWithApplicant(IN p_username VARCHAR(255))
      BEGIN
        SELECT 
          c.credential_id,
          c.applicant_id,
          c.username,
          c.password_hash,
          c.refresh_token_hash,
          c.last_login,
          a.first_name,
          a.last_name,
          a.contact_number as applicant_contact_number,
          a.address as applicant_address,
          a.birthdate as applicant_birthdate,
          a.civil_status as applicant_civil_status,
          a.educational_attainment as applicant_educational_attainment,
          a.created_date
        FROM credential c
        LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
        WHERE c.username = p_username;
      END
    `);
    console.log('✅ Done');

    console.log('\n✅ CREDENTIAL STORED PROCEDURE FIXED!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await conn.end();
  }
}

fixCredentialSP();
