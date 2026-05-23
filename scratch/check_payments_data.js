import { createConnection } from 'file:///c:/Users/Jeno/DigiStall-CP2025-2026/config/database.js';

async function test() {
  let connection;
  try {
    connection = await createConnection();
    const [rows] = await connection.execute(`
      SELECT payment_id, stallholder_id, amount, payment_date, payment_for_month, payment_status, reference_number, promise_to_pay_date, created_at 
      FROM payments 
      ORDER BY payment_id DESC 
      LIMIT 5
    `);
    console.log('\n--- LATEST 5 PAYMENTS ---');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Failed to query database:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();

