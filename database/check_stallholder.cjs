// Check stallholder table schema
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
  
  const [rows] = await connection.query('DESCRIBE stallholder');
  console.log('=== STALLHOLDER TABLE SCHEMA ===');
  rows.forEach(row => {
    console.log(`  ${row.Field} - ${row.Type}`);
  });
  await connection.end();
}

test().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
