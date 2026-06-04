import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { decryptData } from '../services/encryptionService.js';

dotenv.config();

const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com');

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'naga_stall',
  ...(isCloudDB && {
    ssl: { rejectUnauthorized: false }
  })
};

const decryptSafe = (value) => {
  if (value === undefined || value === null || value === '') return value;
  try {
    if (typeof value === 'string' && value.includes(':') && value.split(':').length === 3) {
      return decryptData(value);
    }
    return value;
  } catch (error) {
    return value;
  }
};

async function main() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    console.log('Querying all stallholders...');
    
    const query = `
      SELECT 
        sh.stallholder_id as id,
        sh.full_name as name,
        sh.status as contract_status,
        sh.payment_status,
        s.stall_number as stallNo
      FROM stallholder sh
      LEFT JOIN stall s ON sh.stall_id = s.stall_id
      WHERE LOWER(sh.status) = 'active'
      ORDER BY sh.stallholder_id
    `;
    
    const [result] = await connection.execute(query);
    console.log('Total result length:', result.length);

    const decrypted = result.map(sh => ({
      id: sh.id,
      name: decryptSafe(sh.name),
      stallNo: sh.stallNo,
      status: sh.contract_status,
      payment_status: sh.payment_status
    }));

    console.log('Decrypted active stallholders:');
    console.log(decrypted);

  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();
