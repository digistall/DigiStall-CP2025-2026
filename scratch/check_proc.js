import { createConnection } from 'file:///c:/Users/Jeno/DigiStall-CP2025-2026/config/database.js';

async function test() {
  let connection;
  try {
    connection = await createConnection();
    const [rows] = await connection.execute(`SHOW CREATE PROCEDURE sp_getAllPaymentsByStallholder`);
    console.log('\n--- CREATE PROCEDURE sp_getAllPaymentsByStallholder ---');
    console.log(rows[0]?.['Create Procedure']);
  } catch (err) {
    console.error('Failed to get procedure definition:', err);
  } finally {
    if (connection) await connection.end();
  }
}

test();
