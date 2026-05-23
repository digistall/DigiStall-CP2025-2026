const mysql = require('mysql2/promise');
const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function checkJiro() {
  const conn = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await conn.execute(`
      SELECT p.payment_id, p.stallholder_id, sh.full_name, p.amount, p.payment_status, p.promise_to_pay_date, p.created_at
      FROM payments p
      JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
      ORDER BY p.payment_id DESC LIMIT 10
    `);
    console.log(rows);
  } finally {
    conn.end();
  }
}

checkJiro().catch(console.error);
