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
    const [rows] = await connection.execute(`
      SELECT payment_id, stallholder_id, amount, payment_status, payment_date, payment_for_month, promise_to_pay_date, reference_number, created_at
      FROM payments 
      WHERE stallholder_id = 5
      ORDER BY payment_id DESC
    `);
    console.log('Jiro Adrian payments:');
    console.log(JSON.stringify(rows, null, 2));

    const [shRows] = await connection.execute(`
      SELECT stallholder_id, payment_status, status, move_in_date
      FROM stallholder
      WHERE stallholder_id = 5
    `);
    console.log('Jiro Adrian stallholder status:');
    console.log(JSON.stringify(shRows, null, 2));
  } finally {
    await connection.end();
  }
}
check().catch(console.error);
