import { createConnection } from '../config/database.js';

async function test() {
  let connection;
  try {
    connection = await createConnection();
    console.log('Updating payment 15 in database...');
    const [result] = await connection.execute(`
      UPDATE payments 
      SET payment_status = 'partial', 
          promise_to_pay_date = '2026-06-05',
          reference_number = '5454KAJY54'
      WHERE payment_id = 15
    `);
    console.log('Update result:', result);
  } catch (err) {
    console.error('Failed to update database:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();
