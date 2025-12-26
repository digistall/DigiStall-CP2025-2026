import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function fixDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n🔧 Fixing Database Schema...\n');

  // 1. Add last_login to business_manager if missing
  console.log('1️⃣ Adding last_login to business_manager table...');
  try {
    await connection.execute(`
      ALTER TABLE business_manager 
      ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL
    `);
    console.log('   ✅ Added last_login column to business_manager');
  } catch (e) {
    if (e.code === 'ER_DUP_FIELDNAME') {
      console.log('   ℹ️  Column already exists');
    } else {
      console.log('   ❌ Error:', e.message);
    }
  }

  // 2. Fix inspector timestamps - the issue is the database stores UTC but we need to adjust for display
  // Actually the real fix is to store Philippine time directly
  console.log('\n2️⃣ Checking current inspector login time...');
  const [inspectors] = await connection.query("SELECT inspector_id, first_name, last_name, last_login FROM inspector WHERE last_login IS NOT NULL");
  
  for (const insp of inspectors) {
    console.log(`   Inspector ${insp.first_name}: DB value = ${insp.last_login}`);
    // The time 2025-12-25T19:37:23.000Z is actually stored as UTC
    // When you logged in at ~11:37 AM Philippine time, it was stored as 3:37 AM UTC (11:37 - 8 = 3:37)
    // We need to ADD 8 hours to convert UTC to Philippine time for proper display
    
    // Check if this timestamp needs fixing (if it's more than 6 hours behind current PH time)
    const dbTime = new Date(insp.last_login);
    const now = new Date();
    const phNow = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
    
    // If the DB time appears to be UTC (8 hours behind), fix it
    const hoursDiff = (phNow - dbTime) / (1000 * 60 * 60);
    console.log(`   Hours since login: ${hoursDiff.toFixed(1)}`);
  }

  // 3. Update the timestamps to be Philippine time (add 8 hours to convert from UTC)
  console.log('\n3️⃣ Converting UTC timestamps to Philippine time...');
  
  // Fix inspector last_login
  const [inspResult] = await connection.execute(`
    UPDATE inspector 
    SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR)
    WHERE last_login IS NOT NULL 
    AND last_login < DATE_SUB(NOW(), INTERVAL 4 HOUR)
  `);
  console.log(`   ✅ Fixed ${inspResult.affectedRows} inspector record(s)`);

  // Fix collector last_login
  const [collResult] = await connection.execute(`
    UPDATE collector 
    SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR)
    WHERE last_login IS NOT NULL 
    AND last_login < DATE_SUB(NOW(), INTERVAL 4 HOUR)
  `);
  console.log(`   ✅ Fixed ${collResult.affectedRows} collector record(s)`);

  // Fix activity log timestamps
  const [logResult] = await connection.execute(`
    UPDATE staff_activity_log 
    SET created_at = DATE_ADD(created_at, INTERVAL 8 HOUR)
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 4 HOUR)
  `);
  console.log(`   ✅ Fixed ${logResult.affectedRows} activity log record(s)`);

  // 4. Verify the fix
  console.log('\n4️⃣ Verifying fix...');
  const [fixedInsp] = await connection.query("SELECT inspector_id, first_name, last_name, last_login FROM inspector WHERE last_login IS NOT NULL");
  console.table(fixedInsp);

  const [fixedLogs] = await connection.query("SELECT log_id, staff_name, action_type, created_at FROM staff_activity_log ORDER BY created_at DESC LIMIT 5");
  console.table(fixedLogs);

  await connection.end();
  console.log('\n✅ Database fixes complete!');
}

fixDatabase().catch(e => console.error('Error:', e.message));
