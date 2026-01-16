// Fix createInspector and createCollector to have 5 params (without branch_id)
const mysql = require('mysql2/promise');

const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function fixProcedures() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('✅ Connected');
  
  // Fix createInspector (5 params - without branch_id since assignment is separate)
  try {
    await conn.query('DROP PROCEDURE IF EXISTS createInspector');
    await conn.query(`
      CREATE PROCEDURE createInspector(
        IN p_password VARCHAR(500),
        IN p_first_name VARCHAR(500),
        IN p_last_name VARCHAR(500),
        IN p_email VARCHAR(500),
        IN p_contact_no VARCHAR(500)
      )
      BEGIN
        INSERT INTO inspector (
          password, first_name, last_name, email, contact_no, date_hired, status
        ) VALUES (
          p_password, p_first_name, p_last_name, p_email, p_contact_no, CURDATE(), 'active'
        );
        SELECT LAST_INSERT_ID() AS inspector_id;
      END
    `);
    console.log('  ✅ createInspector fixed (5 params)');
  } catch (e) {
    console.log('  ❌ createInspector:', e.message);
  }
  
  // Fix createCollector (5 params - without branch_id since assignment is separate)
  try {
    await conn.query('DROP PROCEDURE IF EXISTS createCollector');
    await conn.query(`
      CREATE PROCEDURE createCollector(
        IN p_password VARCHAR(500),
        IN p_first_name VARCHAR(500),
        IN p_last_name VARCHAR(500),
        IN p_email VARCHAR(500),
        IN p_contact_no VARCHAR(500)
      )
      BEGIN
        INSERT INTO collector (
          password, first_name, last_name, email, contact_no, date_hired, status
        ) VALUES (
          p_password, p_first_name, p_last_name, p_email, p_contact_no, CURDATE(), 'active'
        );
        SELECT LAST_INSERT_ID() AS collector_id;
      END
    `);
    console.log('  ✅ createCollector fixed (5 params)');
  } catch (e) {
    console.log('  ❌ createCollector:', e.message);
  }
  
  console.log('\n✅ Done! Procedures match controller calls.');
  await conn.end();
}

fixProcedures().catch(console.error);
