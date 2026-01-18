// Quick test to verify stall query works
const mysql = require('mysql2/promise');

async function test() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  const [rows] = await connection.query(
    'SELECT s.stall_id, s.stall_number, s.floor_level, s.section, s.description FROM stall s LIMIT 3'
  );
  console.log('=== STALL DATA TEST ===');
  console.log(JSON.stringify(rows, null, 2));
  console.log('✅ Query successful!');
  await connection.end();
}

test().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
