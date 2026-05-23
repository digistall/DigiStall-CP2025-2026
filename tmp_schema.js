import { createConnection } from './BACKEND/config/database.js';

async function describeTable() {
  const connection = await createConnection();
  try {
    const [tables] = await connection.execute("SHOW TABLES LIKE '%subscription%'");
    console.log("Tables found:", tables);
    
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [[schema]] = await connection.execute(`SHOW CREATE TABLE ${tableName}`);
      console.log(`\n--- SCHEMA FOR ${tableName} ---`);
      console.log(schema['Create Table']);
    }
  } catch (e) {
    console.error(e);
  } finally {
    connection.end();
  }
}

describeTable();
