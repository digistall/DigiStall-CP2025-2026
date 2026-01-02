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
  
  console.log('🔍 Checking RAW data vs CONVERTED data...\n');
  
  const [raw] = await connection.query(`
    SELECT 
      business_employee_id,
      login_time as raw_login,
      last_activity as raw_activity,
      CONVERT_TZ(login_time, '+00:00', '+08:00') as converted_login,
      CONVERT_TZ(last_activity, '+00:00', '+08:00') as converted_activity
    FROM employee_session
    WHERE business_employee_id = 2
  `);
  
  console.log('employee_session RAW data:');
  raw.forEach(r => {
    console.log(`  raw_login: ${r.raw_login}`);
    console.log(`  converted_login: ${r.converted_login}`);
    console.log(`  raw_activity: ${r.raw_activity}`);
    console.log(`  converted_activity: ${r.converted_activity}`);
  });
  
  console.log('\n🔍 Checking MySQL timezone settings...');
  const [tz] = await connection.query(`SELECT @@global.time_zone, @@session.time_zone, NOW()`);
  console.log(`  Global TZ: ${tz[0]['@@global.time_zone']}`);
  console.log(`  Session TZ: ${tz[0]['@@session.time_zone']}`);
  console.log(`  NOW(): ${tz[0]['NOW()']}`);
  
  await connection.end();
})();
