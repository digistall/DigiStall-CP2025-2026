import mysql from 'mysql2/promise';
import dbConfig from './config/database.js';
import fs from 'fs';

async function runMigration() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    console.log('--- Running Migration 024 ---');
    const sql = fs.readFileSync('./DATABASE/migrations/024_update_sp_submitComplaint_for_evidence.sql', 'utf8');
    
    // We split by DROP and CREATE
    const dropIndex = sql.indexOf('DROP PROCEDURE');
    const createIndex = sql.indexOf('CREATE PROCEDURE');
    
    const dropStatement = sql.substring(dropIndex, createIndex).trim().replace(/;$/, '');
    const createStatement = sql.substring(createIndex).trim();
    
    console.log('Executing drop statement...');
    await connection.query(dropStatement);
    
    console.log('Executing create statement...');
    await connection.query(createStatement);
    
    console.log('✅ Migration 024 applied successfully');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await connection.end();
  }
}

runMigration();




