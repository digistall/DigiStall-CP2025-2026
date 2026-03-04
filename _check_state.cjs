const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  // 1. Check ENUM
  const [s] = await c.execute("SHOW COLUMNS FROM stall WHERE Field = 'raffle_auction_status'");
  console.log('ENUM:', s[0].Type);
  console.log('Default:', s[0].Default);

  // 2. Check result records
  const [ar] = await c.execute('SELECT * FROM auction_result');
  console.log('\nauction_result:', ar);
  const [rr] = await c.execute('SELECT * FROM raffle_result');
  console.log('raffle_result:', rr);

  // 3. Check auction/raffle statuses
  const [auctions] = await c.execute(
    `SELECT a.auction_id, a.stall_id, a.status, s.raffle_auction_status
     FROM auction a JOIN stall s ON a.stall_id = s.stall_id`
  );
  console.log('\nAuctions:');
  auctions.forEach(a => console.log(`  Auction ${a.auction_id}: auction=${a.status}, stall=${a.raffle_auction_status}`));

  const [raffles] = await c.execute(
    `SELECT r.raffle_id, r.stall_id, r.status, s.raffle_auction_status
     FROM raffle r JOIN stall s ON r.stall_id = s.stall_id`
  );
  console.log('Raffles:');
  raffles.forEach(r => console.log(`  Raffle ${r.raffle_id}: raffle=${r.status}, stall=${r.raffle_auction_status}`));

  // 4. Table count
  const [tables] = await c.execute('SHOW TABLES');
  console.log('\nTotal tables:', tables.length);

  // 5. Check which tables were already dropped
  const dropped = ['branch_document_requirements_backup','branch_manager','business_owner_managers',
    'daily_payment','employee_activity_log','employee_credential_log','employee_password_reset',
    'employee_session','migrations','stall_applications','stallholder_document_submissions',
    'subscription_payments'];
  for (const t of dropped) {
    const found = tables.find(row => Object.values(row)[0] === t);
    console.log(`  ${t}: ${found ? 'EXISTS' : 'DROPPED'}`);
  }

  await c.end();
})();
