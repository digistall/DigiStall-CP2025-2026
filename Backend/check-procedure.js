import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('=== Checking sp_createOrUpdateEmployeeSession ===\n');
  
  // Check stored procedure definition
  const [rows] = await connection.query(`SHOW CREATE PROCEDURE sp_createOrUpdateEmployeeSession`);
  console.log('Procedure Definition:');
  console.log(rows[0]['Create Procedure']);
  
  console.log('\n=== Current employee_session data ===');
  const [sessions] = await connection.query(`
    SELECT 
      es.session_id,
      es.business_employee_id,
      es.is_active,
      es.login_time,
      es.last_activity,
      es.logout_time,
      be.first_name,
      be.last_name,
      be.last_login,
      be.last_logout
    FROM employee_session es
    JOIN business_employee be ON es.business_employee_id = be.business_employee_id
    ORDER BY es.session_id
  `);
  
  sessions.forEach(s => {
    console.log(`\nEmployee: ${s.first_name} ${s.last_name} (ID: ${s.business_employee_id})`);
    console.log(`  Session is_active: ${s.is_active}`);
    console.log(`  Session login_time: ${s.login_time}`);
    console.log(`  Session last_activity: ${s.last_activity}`);
    console.log(`  Session logout_time: ${s.logout_time}`);
    console.log(`  Employee last_login: ${s.last_login}`);
    console.log(`  Employee last_logout: ${s.last_logout}`);
  });
  
  await connection.end();
})();
