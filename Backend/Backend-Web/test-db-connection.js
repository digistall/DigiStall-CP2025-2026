// Database Connection Diagnostic Script
// Run this to test your DigitalOcean database connection

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from parent Backend folder
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectTimeout: 10000, // 10 seconds for testing
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

console.log('🔍 Testing Database Connection...\n');
console.log('📋 Configuration:');
console.log(`   Host: ${dbConfig.host}`);
console.log(`   Port: ${dbConfig.port}`);
console.log(`   Database: ${dbConfig.database}`);
console.log(`   User: ${dbConfig.user}`);
console.log(`   Password: ${dbConfig.password ? '***' + dbConfig.password.slice(-4) : 'NOT SET'}`);
console.log(`   SSL: ${dbConfig.ssl ? 'Enabled' : 'Disabled'}`);
console.log(`   Timeout: ${dbConfig.connectTimeout}ms`);
console.log('\n⏳ Attempting connection...\n');

async function testConnection() {
  const startTime = Date.now();
  
  try {
    console.log('1️⃣ Creating connection...');
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connection created');
    
    console.log('\n2️⃣ Testing with simple query...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Query successful:', rows);
    
    console.log('\n3️⃣ Checking database tables...');
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM information_schema.tables 
      WHERE table_schema = ?
      LIMIT 10
    `, [dbConfig.database]);
    console.log(`✅ Found ${tables.length} tables (showing first 10):`);
    tables.forEach((table, i) => {
      console.log(`   ${i + 1}. ${table.TABLE_NAME}`);
    });
    
    console.log('\n4️⃣ Checking stored procedures...');
    const [procedures] = await connection.execute(`
      SELECT ROUTINE_NAME 
      FROM information_schema.routines 
      WHERE routine_schema = ? AND routine_type = 'PROCEDURE'
      LIMIT 10
    `, [dbConfig.database]);
    console.log(`✅ Found ${procedures.length} stored procedures (showing first 10):`);
    procedures.forEach((proc, i) => {
      console.log(`   ${i + 1}. ${proc.ROUTINE_NAME}`);
    });
    
    console.log('\n5️⃣ Closing connection...');
    await connection.end();
    console.log('✅ Connection closed');
    
    const duration = Date.now() - startTime;
    console.log(`\n✅ ✅ ✅ CONNECTION SUCCESSFUL! ✅ ✅ ✅`);
    console.log(`⏱️  Total time: ${duration}ms`);
    console.log('\n🎉 Your database is properly configured and accessible!');
    console.log('🚀 You can now start your backend server.\n');
    
    process.exit(0);
    
  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error('\n❌ ❌ ❌ CONNECTION FAILED! ❌ ❌ ❌');
    console.error(`⏱️  Failed after: ${duration}ms`);
    console.error(`\n📋 Error Details:`);
    console.error(`   Message: ${error.message}`);
    console.error(`   Code: ${error.code}`);
    console.error(`   Errno: ${error.errno}`);
    console.error(`   SQL State: ${error.sqlState || 'N/A'}`);
    
    console.log('\n🔧 Troubleshooting Steps:\n');
    
    if (error.code === 'ETIMEDOUT') {
      console.log('⚠️  CONNECTION TIMEOUT');
      console.log('   This usually means:\n');
      console.log('   1. DigitalOcean database firewall is blocking your IP');
      console.log('   2. Database is not accessible from your network');
      console.log('   3. Wrong host/port configuration\n');
      console.log('   ✅ SOLUTION:');
      console.log('      → Go to DigitalOcean → Databases → Settings → Trusted Sources');
      console.log('      → Click "Allow my IP" or add 0.0.0.0/0 for testing');
      console.log('      → Save and try again\n');
    } else if (error.code === 'ENOTFOUND') {
      console.log('⚠️  HOST NOT FOUND');
      console.log('   The database host cannot be resolved.\n');
      console.log('   ✅ SOLUTION:');
      console.log('      → Check DB_HOST in .env file');
      console.log('      → Verify database exists in DigitalOcean');
      console.log('      → Check your internet connection\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('⚠️  ACCESS DENIED');
      console.log('   Wrong username or password.\n');
      console.log('   ✅ SOLUTION:');
      console.log('      → Check DB_USER and DB_PASSWORD in .env');
      console.log('      → Get correct credentials from DigitalOcean dashboard\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('⚠️  DATABASE NOT FOUND');
      console.log('   The database name is incorrect.\n');
      console.log('   ✅ SOLUTION:');
      console.log('      → Check DB_NAME in .env file');
      console.log('      → Verify database name in DigitalOcean\n');
    } else {
      console.log('⚠️  UNKNOWN ERROR');
      console.log('   ✅ SOLUTION:');
      console.log('      → Check all .env variables');
      console.log('      → Review DigitalOcean database status');
      console.log('      → Try switching to local database for testing\n');
    }
    
    console.log('📚 For more help, see: docs/DIGITALOCEAN_CONNECTION_TROUBLESHOOTING.md\n');
    
    process.exit(1);
  }
}

testConnection();
