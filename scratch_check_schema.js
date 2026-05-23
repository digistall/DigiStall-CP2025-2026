import { createConnection } from './config/database.js';
async function run() {
  const conn = await createConnection();
  const [rows] = await conn.execute('DESCRIBE stallholder');
  console.log(rows.find(r => r.Field === 'payment_status'));
  process.exit(0);
}
run();
