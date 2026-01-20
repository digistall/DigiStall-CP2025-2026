const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  try {
    console.log('Fixing sp_getCredentialWithApplicant stored procedure...');
    
    await conn.query('DROP PROCEDURE IF EXISTS sp_getCredentialWithApplicant');
    
    await conn.query(`
      CREATE PROCEDURE sp_getCredentialWithApplicant(
        IN p_username VARCHAR(100)
      )
      BEGIN
        SELECT 
          c.credential_id,
          c.applicant_id,
          c.username,
          c.password_hash,
          c.refresh_token_hash,
          c.last_login,
          a.applicant_username,
          a.applicant_full_name,
          a.applicant_contact_number,
          a.applicant_address,
          a.status
        FROM credential c
        INNER JOIN applicant a ON c.applicant_id = a.applicant_id
        WHERE c.username = p_username
        LIMIT 1;
      END
    `);
    
    console.log('✅ Fixed sp_getCredentialWithApplicant');
    console.log('\nThe stored procedure now uses applicant_username from applicant table');
    console.log('Login should now work with: josonglaurente@gmail.com');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
})();
