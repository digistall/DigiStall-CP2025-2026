import mysql from 'mysql2/promise';

async function fixStoredProcedures() {
  const connection = await mysql.createConnection({
    host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: 25060,
    user: 'doadmin',
    password: 'AVNS_hxkemfGwzsOdj4pbu35',
    database: 'naga_stall',
    ssl: { rejectUnauthorized: false },
    multipleStatements: true
  });

  try {
    console.log('🔧 Fixing stored procedures...\n');

    // Fix sp_getAllStalls_complete_decrypted
    console.log('1. Fixing sp_getAllStalls_complete_decrypted...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_getAllStalls_complete_decrypted');
    await connection.query(`
      CREATE PROCEDURE sp_getAllStalls_complete_decrypted(
        IN p_user_id INT,
        IN p_user_type VARCHAR(50),
        IN p_branch_id INT
      )
      BEGIN
        IF p_user_type = 'system_administrator' THEN
          SELECT 
            st.stall_id, st.stall_no, st.status, st.rental_price, st.area_sqm,
            f.branch_id, b.branch_name,
            sh.stallholder_id,
            sh.stallholder_name,
            sh.business_name, sh.business_type
          FROM stall st
          LEFT JOIN section sec ON st.section_id = sec.section_id
          LEFT JOIN floor f ON sec.floor_id = f.floor_id
          LEFT JOIN branch b ON f.branch_id = b.branch_id
          LEFT JOIN stallholder sh ON sh.stall_id = st.stall_id
          ORDER BY st.stall_id;
        ELSE
          SELECT 
            st.stall_id, st.stall_no, st.status, st.rental_price, st.area_sqm,
            f.branch_id, b.branch_name,
            sh.stallholder_id,
            sh.stallholder_name,
            sh.business_name, sh.business_type
          FROM stall st
          LEFT JOIN section sec ON st.section_id = sec.section_id
          LEFT JOIN floor f ON sec.floor_id = f.floor_id
          LEFT JOIN branch b ON f.branch_id = b.branch_id
          LEFT JOIN stallholder sh ON sh.stall_id = st.stall_id
          WHERE f.branch_id = p_branch_id OR p_branch_id IS NULL
          ORDER BY st.stall_id;
        END IF;
      END
    `);
    console.log('   ✅ sp_getAllStalls_complete_decrypted fixed!\n');

    // Check sp_logStaffActivityLogin
    console.log('2. Checking sp_logStaffActivityLogin...');
    const [procResult] = await connection.query("SHOW CREATE PROCEDURE sp_logStaffActivityLogin");
    console.log('   Current parameters:', procResult[0]['Create Procedure'].match(/\([\s\S]*?\)/)?.[0]);
    
    console.log('\n✅ All stored procedures fixed!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await connection.end();
  }
}

fixStoredProcedures();
