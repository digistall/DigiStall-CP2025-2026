// Test the web getAllStalls query
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
  
  // This is the fixed query from getAllStalls.js
  const query = `
    SELECT 
      s.stall_id,
      s.stall_number,
      s.stall_name,
      s.stall_size,
      s.stall_location,
      s.size,
      s.status,
      s.monthly_rent,
      s.rental_price,
      s.price_type,
      s.is_available,
      s.raffle_auction_status,
      s.raffle_auction_deadline,
      s.deadline_active,
      s.floor_level,
      s.section,
      s.amenities,
      b.branch_id,
      b.branch_name,
      b.location AS branch_location,
      sh.stallholder_id,
      sh.full_name AS stallholder_name
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN stallholder sh ON s.stallholder_id = sh.stallholder_id
    WHERE s.stall_id > 0
    ORDER BY s.stall_id DESC
    LIMIT 3
  `;
  
  const [rows] = await connection.query(query);
  
  console.log('=== WEB STALLS QUERY TEST ===');
  console.log('Total stalls returned:', rows.length);
  rows.forEach((stall, i) => {
    console.log(`\nStall ${i + 1}:`);
    console.log('  stall_number:', stall.stall_number);
    console.log('  floor_level:', stall.floor_level);
    console.log('  section:', stall.section);
    console.log('  branch_name:', stall.branch_name);
    console.log('  stallholder_name:', stall.stallholder_name);
  });
  console.log('\n✅ Web stalls query test successful!');
  await connection.end();
}

test().catch(e => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
