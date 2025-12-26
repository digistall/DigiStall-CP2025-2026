import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function testTimezone() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n🕐 Timezone Test\n');

  // Check current timezone settings
  const [tzResult] = await connection.query("SELECT @@global.time_zone as global_tz, @@session.time_zone as session_tz");
  console.log('Database timezone settings:', tzResult[0]);

  // Test NOW() vs Philippine time
  const [nowResult] = await connection.query("SELECT NOW() as db_now, UTC_TIMESTAMP() as utc_now");
  console.log('\nDatabase NOW():', nowResult[0].db_now);
  console.log('Database UTC:', nowResult[0].utc_now);
  
  // Get Philippine time from JS
  const jsPhTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' });
  console.log('JavaScript PH time:', jsPhTime);

  // Check what's stored in inspector
  const [inspResult] = await connection.query(`
    SELECT inspector_id, first_name, last_login,
           DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as formatted_login
    FROM inspector WHERE last_login IS NOT NULL
  `);
  console.log('\nInspector login data:');
  console.table(inspResult);

  // Now let's test what happens when we insert Philippine time manually
  console.log('\n📝 Testing insert with Philippine time...');
  
  const phTime = new Date();
  const phTimeStr = new Date(phTime.toLocaleString('en-US', { timeZone: 'Asia/Manila' }));
  const year = phTimeStr.getFullYear();
  const month = String(phTimeStr.getMonth() + 1).padStart(2, '0');
  const day = String(phTimeStr.getDate()).padStart(2, '0');
  const hours = String(phTimeStr.getHours()).padStart(2, '0');
  const minutes = String(phTimeStr.getMinutes()).padStart(2, '0');
  const seconds = String(phTimeStr.getSeconds()).padStart(2, '0');
  const formattedPhTime = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  
  console.log('Philippine time to insert:', formattedPhTime);
  
  // Update inspector's last_login with this time
  await connection.execute(
    "UPDATE inspector SET last_login = ? WHERE inspector_id = 3",
    [formattedPhTime]
  );
  
  // Read back
  const [afterUpdate] = await connection.query(`
    SELECT last_login, DATE_FORMAT(last_login, '%Y-%m-%d %H:%i:%s') as formatted
    FROM inspector WHERE inspector_id = 3
  `);
  console.log('\nAfter update:');
  console.table(afterUpdate);

  await connection.end();
}

testTimezone().catch(e => console.error('Error:', e.message));
