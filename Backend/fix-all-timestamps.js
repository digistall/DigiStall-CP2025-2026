import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixAllTimestamps() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n🔧 FIXING ALL TIMESTAMPS TO PHILIPPINE TIME\n');
  console.log('════════════════════════════════════════════════════════════\n');

  // Get current time info
  const [dbTime] = await connection.query("SELECT NOW() as db_now");
  console.log('Database NOW() (UTC):', dbTime[0].db_now);
  
  const phNow = new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour12: true });
  console.log('Philippine Time Now: ', phNow);
  console.log('\n────────────────────────────────────────────────────────────\n');

  // Fix inspector table - add 8 hours to UTC timestamps
  console.log('1️⃣ Fixing INSPECTOR last_login timestamps...');
  const [inspResult] = await connection.execute(`
    UPDATE inspector 
    SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR)
    WHERE last_login IS NOT NULL 
    AND TIMESTAMPDIFF(HOUR, last_login, NOW()) BETWEEN 6 AND 1000
  `);
  console.log(`   ✅ Updated ${inspResult.affectedRows} inspector record(s)\n`);

  // Fix collector table
  console.log('2️⃣ Fixing COLLECTOR last_login timestamps...');
  const [collResult] = await connection.execute(`
    UPDATE collector 
    SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR)
    WHERE last_login IS NOT NULL 
    AND TIMESTAMPDIFF(HOUR, last_login, NOW()) BETWEEN 6 AND 10000
  `);
  console.log(`   ✅ Updated ${collResult.affectedRows} collector record(s)\n`);

  // Fix business_employee table
  console.log('3️⃣ Fixing BUSINESS_EMPLOYEE last_login timestamps...');
  const [empResult] = await connection.execute(`
    UPDATE business_employee 
    SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR)
    WHERE last_login IS NOT NULL 
    AND TIMESTAMPDIFF(HOUR, last_login, NOW()) BETWEEN 6 AND 10000
  `);
  console.log(`   ✅ Updated ${empResult.affectedRows} business_employee record(s)\n`);

  // Fix business_manager table - check for negative hours (future timestamps)
  console.log('4️⃣ Fixing BUSINESS_MANAGER last_login timestamps...');
  
  // First, subtract 8 hours from future timestamps
  const [mgrFutureResult] = await connection.execute(`
    UPDATE business_manager 
    SET last_login = DATE_SUB(last_login, INTERVAL 8 HOUR)
    WHERE last_login IS NOT NULL 
    AND last_login > NOW()
  `);
  console.log(`   ✅ Fixed ${mgrFutureResult.affectedRows} future timestamp(s)`);
  
  // Then add 8 hours to old UTC timestamps
  const [mgrPastResult] = await connection.execute(`
    UPDATE business_manager 
    SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR)
    WHERE last_login IS NOT NULL 
    AND TIMESTAMPDIFF(HOUR, last_login, NOW()) BETWEEN 6 AND 10000
  `);
  console.log(`   ✅ Fixed ${mgrPastResult.affectedRows} past UTC timestamp(s)\n`);

  // Fix activity log - most critical
  console.log('5️⃣ Fixing STAFF_ACTIVITY_LOG created_at timestamps...');
  
  // First fix future timestamps (subtract 8 hours)
  const [logFutureResult] = await connection.execute(`
    UPDATE staff_activity_log 
    SET created_at = DATE_SUB(created_at, INTERVAL 8 HOUR)
    WHERE created_at > NOW()
  `);
  console.log(`   ✅ Fixed ${logFutureResult.affectedRows} future activity log entries`);
  
  // Then fix old UTC timestamps (add 8 hours)
  const [logPastResult] = await connection.execute(`
    UPDATE staff_activity_log 
    SET created_at = DATE_ADD(created_at, INTERVAL 8 HOUR)
    WHERE TIMESTAMPDIFF(HOUR, created_at, NOW()) BETWEEN 6 AND 10000
  `);
  console.log(`   ✅ Fixed ${logPastResult.affectedRows} past UTC activity log entries\n`);

  // Verify the fixes
  console.log('\n════════════════════════════════════════════════════════════');
  console.log('✅ VERIFICATION');
  console.log('════════════════════════════════════════════════════════════\n');

  const [inspectors] = await connection.query(`
    SELECT 
      CONCAT(first_name, ' ', last_name) as name,
      DATE_FORMAT(last_login, '%Y-%m-%d %I:%i:%s %p') as login_time,
      TIMESTAMPDIFF(MINUTE, last_login, NOW()) as minutes_ago
    FROM inspector 
    WHERE last_login IS NOT NULL
    ORDER BY last_login DESC
    LIMIT 3
  `);
  console.log('📋 Inspector Login Times:');
  console.table(inspectors);

  const [logs] = await connection.query(`
    SELECT 
      staff_name,
      action_type,
      DATE_FORMAT(created_at, '%Y-%m-%d %I:%i:%s %p') as activity_time,
      TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
    FROM staff_activity_log 
    ORDER BY created_at DESC 
    LIMIT 5
  `);
  console.log('\n📋 Recent Activity Logs:');
  console.table(logs);

  console.log('\n✅ All timestamps have been fixed to Philippine Time!\n');
  console.log('📌 Next steps:');
  console.log('   1. Refresh your browser (Ctrl+F5)');
  console.log('   2. Check Employee Management page');
  console.log('   3. Check Activity Log dialog');
  console.log('   4. Login again from mobile to test new timestamps\n');

  await connection.end();
}

fixAllTimestamps().catch(e => {
  console.error('\n❌ Error:', e.message);
  console.error(e.stack);
  process.exit(1);
});
