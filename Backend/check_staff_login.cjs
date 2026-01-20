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
    // Check inspector table schema
    console.log('=== INSPECTOR TABLE SCHEMA ===');
    const [inspectorCols] = await connection.query('SHOW COLUMNS FROM inspector');
    inspectorCols.forEach(c => console.log(' - ' + c.Field));
    
    // Check collector table schema
    console.log('\n=== COLLECTOR TABLE SCHEMA ===');
    const [collectorCols] = await connection.query('SHOW COLUMNS FROM collector');
    collectorCols.forEach(c => console.log(' - ' + c.Field));
    
    // Check sp_getInspectorByUsername procedure
    console.log('\n=== sp_getInspectorByUsername PROCEDURE ===');
    try {
      const [inspProc] = await connection.query('SHOW CREATE PROCEDURE sp_getInspectorByUsername');
      console.log(inspProc[0]['Create Procedure']);
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    // Check sp_getCollectorByUsername procedure
    console.log('\n=== sp_getCollectorByUsername PROCEDURE ===');
    try {
      const [collProc] = await connection.query('SHOW CREATE PROCEDURE sp_getCollectorByUsername');
      console.log(collProc[0]['Create Procedure']);
    } catch (e) {
      console.log('Error:', e.message);
    }
    
    // Check existing inspectors
    console.log('\n=== EXISTING INSPECTORS ===');
    const [inspectors] = await connection.query('SELECT inspector_id, email, first_name, last_name FROM inspector LIMIT 5');
    console.log(JSON.stringify(inspectors, null, 2));
    
    // Check existing collectors
    console.log('\n=== EXISTING COLLECTORS ===');
    const [collectors] = await connection.query('SELECT collector_id, email, first_name, last_name FROM collector LIMIT 5');
    console.log(JSON.stringify(collectors, null, 2));
    
  } catch (err) {
    console.error('Error:', err.message);
  }

  await connection.end();
}

main();
