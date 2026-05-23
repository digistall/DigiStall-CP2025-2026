import { createConnection } from '../config/database.js';

async function main() {
  let connection;
  try {
    connection = await createConnection();
    const [result] = await connection.execute("SHOW CREATE PROCEDURE getAllComplianceRecordsDecrypted");
    console.log('PROCEDURE getAllComplianceRecordsDecrypted:\n', result[0]['Create Procedure']);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    if (connection) await connection.end();
  }
}

main();
