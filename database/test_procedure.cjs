// Test the stored procedure for mobile stalls
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
  
  // Test sp_getStallsByTypeForApplicant (using applicant_id 1 for test)
  const [rows] = await connection.query('CALL sp_getStallsByTypeForApplicant(?, ?, ?)', ['Raffle', 1, null]);
  
  console.log('=== STORED PROCEDURE TEST ===');
  console.log('Total stalls returned:', rows[0].length);
  if (rows[0].length > 0) {
    const sample = rows[0][0];
    console.log('\nSample stall data:');
    console.log('  stall_number:', sample.stall_number);
    console.log('  floor_level:', sample.floor_level);
    console.log('  section:', sample.section);
    console.log('  description:', sample.description);
    console.log('  floor_name:', sample.floor_name);
    console.log('  section_name:', sample.section_name);
    console.log('  application_status:', sample.application_status);
  }
  console.log('\n✅ Stored procedure test successful!');
  await connection.end();
}

test().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
