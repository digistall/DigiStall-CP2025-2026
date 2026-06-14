import { createConnection } from './config/database.js';
import fs from 'fs';
import path from 'path';

async function runMigration() {
  let connection;
  try {
    connection = await createConnection();
    const sqlPath = path.join(process.cwd(), 'DATABASE', 'migrations', '026_create_refresh_tokens_table.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    await connection.query(sqlContent);
    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    if (connection) await connection.end();
  }
}
runMigration();
