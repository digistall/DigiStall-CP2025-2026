const mysql = require('mysql2/promise');
const dbConfig = {
  host: 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: 25060,
  user: 'doadmin',
  password: 'AVNS_hxkemfGwzsOdj4pbu35',
  database: 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function check() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [rows] = await connection.execute('SELECT payment_id, amount, payment_for_month, payment_type, payment_status FROM payments WHERE stallholder_id = 1 ORDER BY payment_for_month');
    console.log(rows);
  } finally {
    await connection.end();
  }
}
check().catch(console.error);
