import { createConnection } from './config/database.js';
async function run() {
  const conn = await createConnection();
  console.log("Altering stallholder table...");
  await conn.execute("ALTER TABLE stallholder MODIFY COLUMN payment_status ENUM('paid','unpaid','overdue','partial') DEFAULT 'unpaid'");
  console.log("Table altered successfully!");
  process.exit(0);
}
run();
