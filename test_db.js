import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function test() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
      connectTimeout: 10000
    });

    console.log('=== Checking stored procedures ===');
    const [procs] = await conn.execute("SHOW PROCEDURE STATUS WHERE Db = 'naga_stall'");
    console.log('Stored procedures:', procs.map(p => p.Name).join(', '));

    console.log('\n=== Testing sp_getBranchIdForManager ===');
    try {
      const [result] = await conn.execute('CALL sp_getBranchIdForManager(?)', [1]);
      console.log('sp_getBranchIdForManager OK:', JSON.stringify(result[0]));
    } catch(e) {
      console.error('sp_getBranchIdForManager FAILED:', e.code, e.message);
    }

    console.log('\n=== Testing sp_getBranchIdForEmployee ===');
    try {
      const [result] = await conn.execute('CALL sp_getBranchIdForEmployee(?)', [1]);
      console.log('sp_getBranchIdForEmployee OK:', JSON.stringify(result[0]));
    } catch(e) {
      console.error('sp_getBranchIdForEmployee FAILED:', e.code, e.message);
    }

    console.log('\n=== Testing sp_getBranchIdsForOwner ===');
    try {
      const [result] = await conn.execute('CALL sp_getBranchIdsForOwner(?)', [1]);
      console.log('sp_getBranchIdsForOwner OK:', JSON.stringify(result[0]));
    } catch(e) {
      console.error('sp_getBranchIdsForOwner FAILED:', e.code, e.message);
    }

    console.log('\n=== Checking sp_getBranchIdsForOwner definition ===');
    try {
      const [result] = await conn.execute('SHOW CREATE PROCEDURE sp_getBranchIdsForOwner');
      console.log('SP body:', result[0]['Create Procedure']);
    } catch(e) {
      console.error('SHOW CREATE FAILED:', e.message);
    }

    console.log('\n=== Testing business_manager table for branch info ===');
    try {
      const [result] = await conn.execute('SELECT business_manager_id, branch_id FROM business_manager LIMIT 3');
      console.log('business_manager rows:', JSON.stringify(result));
    } catch(e) {
      console.error('business_manager FAILED:', e.code, e.message);
    }

    console.log('\n=== Testing payment query (dashboard) ===');
    try {
      const [result] = await conn.execute('SELECT COUNT(*) as cnt FROM payments');
      console.log('payments count:', result[0].cnt);
    } catch(e) {
      console.error('payments FAILED:', e.code, e.message);
    }

    console.log('\n=== Checking encryption service ===');
    console.log('DATA_ENCRYPTION_KEY set:', !!process.env.DATA_ENCRYPTION_KEY);
    console.log('ENCRYPTION_SALT set:', !!process.env.ENCRYPTION_SALT);

    await conn.end();
  } catch(e) {
    console.error('CONNECTION ERROR:', e.code, e.message);
  }
}

test();
