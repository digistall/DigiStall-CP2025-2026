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
    console.log('🔧 Step 1: Fixing sp_getCredentialWithApplicant...');
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
          c.last_login
        FROM credential c
        WHERE c.username = p_username
        LIMIT 1;
      END
    `);
    console.log('✅ sp_getCredentialWithApplicant fixed - uses credential table only');

    console.log('\n🔧 Step 2: Creating getAppliedAreasByApplicant...');
    await conn.query('DROP PROCEDURE IF EXISTS getAppliedAreasByApplicant');
    await conn.query(`
      CREATE PROCEDURE getAppliedAreasByApplicant(
        IN p_applicant_id INT
      )
      BEGIN
        SELECT DISTINCT 
          b.area,
          b.branch_id,
          b.branch_name
        FROM application app
        INNER JOIN stall s ON app.stall_id = s.stall_id
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        WHERE app.applicant_id = p_applicant_id
          AND app.application_status IN ('Pending', 'Approved');
      END
    `);
    console.log('✅ getAppliedAreasByApplicant created');

    console.log('\n🔧 Step 3: Removing applicant_username and applicant_password columns...');
    
    // Check if columns exist first
    const [columns] = await conn.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'naga_stall' 
        AND TABLE_NAME = 'applicant' 
        AND COLUMN_NAME IN ('applicant_username', 'applicant_password')
    `);
    
    if (columns.length > 0) {
      for (const col of columns) {
        await conn.query(`ALTER TABLE applicant DROP COLUMN ${col.COLUMN_NAME}`);
        console.log(`✅ Dropped column: ${col.COLUMN_NAME}`);
      }
    } else {
      console.log('ℹ️ Columns already removed or never existed');
    }

    console.log('\n✅ ALL FIXES COMPLETE!');
    console.log('📝 Summary:');
    console.log('  - sp_getCredentialWithApplicant uses credential table only');
    console.log('  - getAppliedAreasByApplicant stored procedure created');
    console.log('  - applicant_username and applicant_password columns removed');
    console.log('\n🚀 Mobile login should now work!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await conn.end();
  }
})();
