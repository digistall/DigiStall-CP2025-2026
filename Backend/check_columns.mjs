// Check floor and section table columns
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

async function checkColumns() {
  const config = {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  };
  
  const connection = await mysql.createConnection(config);
  
  const [floorCols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'floor'`
  );
  console.log('Floor columns:', floorCols.map(c => c.COLUMN_NAME).join(', '));
  
  const [secCols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'section'`
  );
  console.log('Section columns:', secCols.map(c => c.COLUMN_NAME).join(', '));
  
  const [shCols] = await connection.execute(
    `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'stallholder'`
  );
  console.log('Stallholder columns:', shCols.map(c => c.COLUMN_NAME).join(', '));
  
  await connection.end();
}
checkColumns().catch(console.error);
