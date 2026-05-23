const mysql = require('mysql2/promise');
const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function fixData() {
  const conn = await mysql.createConnection(dbConfig);
  try {
    // 1. Fix payment 15 promise date
    await conn.execute("UPDATE payments SET promise_to_pay_date = '2026-05-23' WHERE payment_id = 15");
    console.log("Fixed payment 15 promise_to_pay_date to 2026-05-23");

    // 2. Fix Jiro Adrian (stallholder 7) payment status
    await conn.execute("UPDATE stallholder SET payment_status = 'paid' WHERE stallholder_id = 7");
    console.log("Fixed stallholder 7 payment_status to paid");

  } finally {
    conn.end();
  }
}

fixData().catch(console.error);
