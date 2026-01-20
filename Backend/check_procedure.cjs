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
    // Check procedure definition
    const [rows] = await connection.query('SHOW CREATE PROCEDURE sp_getCredentialWithApplicant');
    console.log('Procedure Definition:');
    console.log(rows[0]['Create Procedure']);
  } catch (err) {
    console.error('Error:', err.message);
    
    // If procedure doesn't exist, show available login-related procedures
    console.log('\nAvailable procedures:');
    const [procs] = await connection.query(`
      SELECT ROUTINE_NAME 
      FROM INFORMATION_SCHEMA.ROUTINES 
      WHERE ROUTINE_SCHEMA = 'naga_stall' 
      AND ROUTINE_TYPE = 'PROCEDURE'
      AND (ROUTINE_NAME LIKE '%credential%' OR ROUTINE_NAME LIKE '%login%' OR ROUTINE_NAME LIKE '%applicant%')
    `);
    procs.forEach(p => console.log(' - ' + p.ROUTINE_NAME));
  }

  await connection.end();
}

main();
