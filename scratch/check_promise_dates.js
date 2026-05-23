import { createConnection } from 'file:///c:/Users/Jeno/DigiStall-CP2025-2026/config/database.js';

async function checkPromiseDates() {
  const connection = await createConnection();
  try {
    const [rows] = await connection.execute(`
      SELECT payment_id, stallholder_id, amount, payment_date, payment_for_month, payment_type, promise_to_pay_date 
      FROM payments 
      WHERE promise_to_pay_date IS NOT NULL
      ORDER BY payment_id DESC 
      LIMIT 10
    `);
    console.log("Payments with Promise Dates:");
    console.table(rows);
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

checkPromiseDates();
