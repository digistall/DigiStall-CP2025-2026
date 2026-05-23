import { createConnection } from './config/database.js';

async function test() {
  let connection;
  try {
    connection = await createConnection();
    
    // Check if promise_to_pay_date exists in payments
    const [columns] = await connection.execute(`DESCRIBE payments`);
    console.log(`\nColumns in payments:`, columns.map(c => ({ Field: c.Field, Type: c.Type })));
    
    // Check if column exists
    const hasPromiseDate = columns.some(c => c.Field === 'promise_to_pay_date');
    if (!hasPromiseDate) {
      console.log('Adding promise_to_pay_date column to payments table...');
      await connection.execute(`ALTER TABLE payments ADD COLUMN promise_to_pay_date DATE NULL`);
      console.log('Column added successfully.');
    } else {
      console.log('promise_to_pay_date already exists.');
    }
  } catch (err) {
    console.error('Failed to describe table:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();
