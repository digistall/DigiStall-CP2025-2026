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
  
  console.log('🔧 Checking timezone settings...\n');
  
  // Check MySQL timezone
  const [tzRows] = await connection.query(`SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz, NOW() as now_time, CURRENT_TIMESTAMP as current_ts`);
  console.log('MySQL Timezone Info:');
  console.log(`  Global timezone: ${tzRows[0].global_tz}`);
  console.log(`  Session timezone: ${tzRows[0].session_tz}`);
  console.log(`  NOW(): ${tzRows[0].now_time}`);
  console.log(`  CURRENT_TIMESTAMP: ${tzRows[0].current_ts}`);
  
  // Check employee_session data
  console.log('\n📊 employee_session times:');
  const [sessions] = await connection.query(`
    SELECT 
      business_employee_id,
      login_time,
      last_activity,
      CONVERT_TZ(login_time, '+00:00', '+08:00') as login_time_pht,
      CONVERT_TZ(last_activity, '+00:00', '+08:00') as last_activity_pht
    FROM employee_session
    WHERE business_employee_id = 2
  `);
  
  if (sessions.length > 0) {
    const s = sessions[0];
    console.log(`  login_time (stored): ${s.login_time}`);
    console.log(`  login_time (PHT): ${s.login_time_pht}`);
    console.log(`  last_activity (stored): ${s.last_activity}`);
    console.log(`  last_activity (PHT): ${s.last_activity_pht}`);
  }
  
  // Check business_employee last_login
  console.log('\n📊 business_employee times:');
  const [employees] = await connection.query(`
    SELECT last_login, last_logout FROM business_employee WHERE business_employee_id = 2
  `);
  
  if (employees.length > 0) {
    console.log(`  last_login: ${employees[0].last_login}`);
    console.log(`  last_logout: ${employees[0].last_logout}`);
  }
  
  await connection.end();
})();
