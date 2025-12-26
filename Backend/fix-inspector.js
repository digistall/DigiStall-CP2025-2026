import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixInspectorTime() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  console.log('🔧 Fixing Jonas Laurente inspector timestamp...\n');

  // Show current value
  const [before] = await connection.query(`
    SELECT inspector_id, first_name, last_name, last_login 
    FROM inspector WHERE first_name = 'Jonas' AND last_name = 'Laurente'
  `);
  console.log('Before fix:');
  console.table(before);

  // Fix: Add 8 hours to the timestamp that shows 2:47 AM (should be 10:47 AM)
  const [result] = await connection.execute(`
    UPDATE inspector 
    SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR)
    WHERE first_name = 'Jonas' AND last_name = 'Laurente'
      AND HOUR(last_login) < 8  -- Only fix if time looks like UTC (early morning hours)
  `);
  
  console.log(`\n✅ Fixed ${result.affectedRows} inspector record(s)`);

  // Show after fix
  const [after] = await connection.query(`
    SELECT inspector_id, first_name, last_name, last_login 
    FROM inspector WHERE first_name = 'Jonas' AND last_name = 'Laurente'
  `);
  console.log('\nAfter fix:');
  console.table(after);

  // Also fix any activity logs from mobile that were stored in UTC
  const [activityResult] = await connection.execute(`
    UPDATE staff_activity_log 
    SET created_at = DATE_ADD(created_at, INTERVAL 8 HOUR)
    WHERE staff_name LIKE '%Jonas%' AND module = 'mobile_app'
      AND HOUR(created_at) < 8
      AND DATE(created_at) = CURDATE()
  `);
  
  console.log(`\n✅ Fixed ${activityResult.affectedRows} activity log record(s)`);

  await connection.end();
  console.log('\n✅ Done!');
}

fixInspectorTime().catch(e => console.error('Error:', e.message));
