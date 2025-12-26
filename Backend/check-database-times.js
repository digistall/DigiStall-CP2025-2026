import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkDatabaseTimes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('🔍 COMPLETE DATABASE TIME CHECK');
  console.log('═══════════════════════════════════════════════════════════\n');

  // Current time check
  console.log('⏰ CURRENT TIME INFORMATION:');
  console.log('─────────────────────────────────────────────────────────────');
  
  const jsNow = new Date();
  const phNow = new Date(jsNow.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  
  console.log('JavaScript Local Time:', jsNow.toLocaleString());
  console.log('JavaScript PH Time:   ', phNow.toLocaleString());
  console.log('Expected PH Time:     ', new Date().toLocaleString('en-PH', { timeZone: 'Asia/Manila', hour12: true }));
  
  const [dbTime] = await connection.query("SELECT NOW() as db_now, UTC_TIMESTAMP() as utc_now");
  console.log('Database NOW():       ', dbTime[0].db_now);
  console.log('Database UTC:         ', dbTime[0].utc_now);
  
  const [tzInfo] = await connection.query("SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz");
  console.log('DB Global Timezone:   ', tzInfo[0].global_tz);
  console.log('DB Session Timezone:  ', tzInfo[0].session_tz);

  // Inspector table check
  console.log('\n\n📋 INSPECTOR TABLE DATA:');
  console.log('─────────────────────────────────────────────────────────────');
  const [inspectors] = await connection.query(`
    SELECT 
      inspector_id,
      CONCAT(first_name, ' ', last_name) as name,
      last_login as raw_timestamp,
      DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as formatted_time,
      TIMESTAMPDIFF(HOUR, last_login, NOW()) as hours_ago
    FROM inspector 
    WHERE last_login IS NOT NULL
    ORDER BY last_login DESC
  `);
  
  console.table(inspectors);

  // Collector table check
  console.log('\n📋 COLLECTOR TABLE DATA:');
  console.log('─────────────────────────────────────────────────────────────');
  const [collectors] = await connection.query(`
    SELECT 
      collector_id,
      CONCAT(first_name, ' ', last_name) as name,
      last_login as raw_timestamp,
      DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as formatted_time,
      TIMESTAMPDIFF(HOUR, last_login, NOW()) as hours_ago
    FROM collector 
    WHERE last_login IS NOT NULL
    ORDER BY last_login DESC
  `);
  
  console.table(collectors);

  // Activity log check
  console.log('\n📋 STAFF ACTIVITY LOG (Last 10 entries):');
  console.log('─────────────────────────────────────────────────────────────');
  const [logs] = await connection.query(`
    SELECT 
      log_id,
      staff_name,
      staff_type,
      action_type,
      module,
      created_at as raw_timestamp,
      DATE_FORMAT(created_at, '%Y-%m-%d %H:%i:%s') as formatted_time,
      TIMESTAMPDIFF(MINUTE, created_at, NOW()) as minutes_ago
    FROM staff_activity_log 
    ORDER BY created_at DESC 
    LIMIT 10
  `);
  
  console.table(logs);

  // Business manager check
  console.log('\n📋 BUSINESS MANAGER TABLE DATA:');
  console.log('─────────────────────────────────────────────────────────────');
  const [managers] = await connection.query(`
    SELECT 
      business_manager_id,
      CONCAT(first_name, ' ', last_name) as name,
      last_login as raw_timestamp,
      DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as formatted_time,
      TIMESTAMPDIFF(HOUR, last_login, NOW()) as hours_ago
    FROM business_manager 
    WHERE last_login IS NOT NULL
    ORDER BY last_login DESC
    LIMIT 5
  `);
  
  if (managers.length > 0) {
    console.table(managers);
  } else {
    console.log('No business manager login records found.');
  }

  // Business employee check
  console.log('\n📋 BUSINESS EMPLOYEE TABLE DATA:');
  console.log('─────────────────────────────────────────────────────────────');
  const [employees] = await connection.query(`
    SELECT 
      business_employee_id,
      CONCAT(first_name, ' ', last_name) as name,
      last_login as raw_timestamp,
      DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as formatted_time,
      TIMESTAMPDIFF(HOUR, last_login, NOW()) as hours_ago
    FROM business_employee 
    WHERE last_login IS NOT NULL
    ORDER BY last_login DESC
    LIMIT 5
  `);
  
  console.table(employees);

  // Analysis
  console.log('\n\n🔬 TIME DIFFERENCE ANALYSIS:');
  console.log('─────────────────────────────────────────────────────────────');
  
  if (inspectors.length > 0) {
    const latestInspector = inspectors[0];
    console.log('\nLatest Inspector Login:');
    console.log('  Name:', latestInspector.name);
    console.log('  Raw Timestamp:', latestInspector.raw_timestamp);
    console.log('  Formatted:', latestInspector.formatted_time);
    console.log('  Hours Ago:', latestInspector.hours_ago);
    
    // Check if time looks like UTC (should be ~0-2 hours ago for recent login)
    if (latestInspector.hours_ago > 6) {
      console.log('\n  ⚠️  WARNING: Hours ago is > 6, this suggests UTC time is stored!');
      console.log('  💡 SOLUTION: Need to add 8 hours to this timestamp');
    } else if (latestInspector.hours_ago >= 0 && latestInspector.hours_ago <= 2) {
      console.log('\n  ✅ GOOD: Time appears to be Philippine time (recent login)');
    }
  }

  console.log('\n\n📊 RECOMMENDATIONS:');
  console.log('─────────────────────────────────────────────────────────────');
  console.log('1. Database server timezone is:', tzInfo[0].global_tz);
  console.log('2. If timestamps show 8 hours behind, database is storing UTC');
  console.log('3. Fix: Update timestamps by adding 8 hours to convert UTC to PH time');
  console.log('4. Future inserts: Use Philippine time in INSERT statements\n');

  await connection.end();
}

checkDatabaseTimes().catch(e => {
  console.error('\n❌ Error:', e.message);
  process.exit(1);
});
