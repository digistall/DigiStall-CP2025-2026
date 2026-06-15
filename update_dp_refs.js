import { getPool } from './config/database.js';
async function run() {
  const pool = getPool();
  try {
    await pool.query("UPDATE daily_payments SET reference_no = CONCAT('DP-20260615-0000', LPAD(receipt_id, 2, '0')) WHERE reference_no IN ('N/A', 'REF001') OR reference_no IS NULL OR reference_no = ''");
    const [rows] = await pool.query('SELECT * FROM daily_payments');
    console.log('Daily Payments:', rows);
  } catch (e) {
    console.error(e);
  } finally {
    process.exit(0);
  }
}
run();
