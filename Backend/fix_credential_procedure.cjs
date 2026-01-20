const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('Dropping old procedure...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_getCredentialWithApplicant');
    
    console.log('Creating updated procedure...');
    await connection.query(`
      CREATE PROCEDURE sp_getCredentialWithApplicant(
        IN p_username VARCHAR(100)
      )
      BEGIN
        SELECT
          c.credential_id as registrationid,
          c.applicant_id,
          c.username as user_name,
          c.password_hash,
          c.created_at as created_date,
          c.last_login,
          1 as is_active,
          a.applicant_full_name,
          a.applicant_contact_number,
          a.applicant_address,
          a.applicant_birthdate,
          a.applicant_civil_status,
          a.applicant_educational_attainment,
          COALESCE(a.applicant_email, '') as applicant_email
        FROM credential c
        INNER JOIN applicant a ON c.applicant_id = a.applicant_id
        WHERE c.username = p_username COLLATE utf8mb4_general_ci
        LIMIT 1;
      END
    `);
    
    console.log('✅ Procedure updated successfully!');
    
    // Test the procedure
    console.log('\nTesting with sample username...');
    const [result] = await connection.query('CALL sp_getCredentialWithApplicant(?)', ['test']);
    console.log('Test result:', result[0] || 'No results (expected if no test user exists)');
    
  } catch (err) {
    console.error('Error:', err.message);
  }

  await connection.end();
}

main();
