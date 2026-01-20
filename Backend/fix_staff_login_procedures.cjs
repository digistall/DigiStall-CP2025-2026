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
    // Fix sp_getInspectorByUsername
    console.log('Fixing sp_getInspectorByUsername...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_getInspectorByUsername');
    await connection.query(`
      CREATE PROCEDURE sp_getInspectorByUsername(IN p_email VARCHAR(100))
      BEGIN
        SELECT
          i.inspector_id,
          i.inspector_id as staff_id,
          i.email,
          i.email as username,
          i.password as password_hash,
          i.first_name,
          i.last_name,
          i.contact_no,
          i.date_hired,
          i.status,
          i.last_login,
          i.encryption_key
        FROM inspector i
        WHERE i.email = p_email COLLATE utf8mb4_general_ci
        AND i.status = 'active'
        LIMIT 1;
      END
    `);
    console.log('✅ sp_getInspectorByUsername fixed!');
    
    // Fix sp_getCollectorByUsername
    console.log('Fixing sp_getCollectorByUsername...');
    await connection.query('DROP PROCEDURE IF EXISTS sp_getCollectorByUsername');
    await connection.query(`
      CREATE PROCEDURE sp_getCollectorByUsername(IN p_email VARCHAR(100))
      BEGIN
        SELECT
          c.collector_id,
          c.collector_id as staff_id,
          c.email,
          c.email as username,
          c.password as password_hash,
          c.first_name,
          c.last_name,
          c.contact_no,
          c.date_hired,
          c.status,
          c.last_login,
          c.encryption_key
        FROM collector c
        WHERE c.email = p_email COLLATE utf8mb4_general_ci
        AND c.status = 'active'
        LIMIT 1;
      END
    `);
    console.log('✅ sp_getCollectorByUsername fixed!');
    
    // Test the procedures
    console.log('\n=== Testing with existing inspector email ===');
    const [inspTest] = await connection.query('CALL sp_getInspectorByUsername(?)', ['requiem121701@gmail.com']);
    console.log('Inspector result:', JSON.stringify(inspTest[0], null, 2));
    
    console.log('\n=== Testing with existing collector email ===');
    const [collTest] = await connection.query('CALL sp_getCollectorByUsername(?)', ['josonglaurente@gmail.com']);
    console.log('Collector result:', JSON.stringify(collTest[0], null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
    console.error(err);
  }

  await connection.end();
}

main();
