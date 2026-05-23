import { createConnection } from './config/database.js';

async function test() {
  let connection;
  try {
    connection = await createConnection();
    
    console.log('Altering payment_status enum to include partial...');
    await connection.execute(`ALTER TABLE payments MODIFY COLUMN payment_status ENUM('pending','completed','failed','refunded','partial') DEFAULT 'pending'`);
    console.log('Column altered successfully.');
  } catch (err) {
    console.error('Failed to alter column:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();
