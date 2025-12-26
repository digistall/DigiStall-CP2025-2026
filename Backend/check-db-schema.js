import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkSchema() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n📊 Checking Database Schema...\n');

  // Check inspector table
  console.log('═══════════════════════════════════════');
  console.log('INSPECTOR TABLE COLUMNS:');
  console.log('═══════════════════════════════════════');
  const [inspectorCols] = await connection.query("SHOW COLUMNS FROM inspector");
  inspectorCols.forEach(col => console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`));
  
  // Check collector table
  console.log('\n═══════════════════════════════════════');
  console.log('COLLECTOR TABLE COLUMNS:');
  console.log('═══════════════════════════════════════');
  const [collectorCols] = await connection.query("SHOW COLUMNS FROM collector");
  collectorCols.forEach(col => console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`));

  // Check business_employee table
  console.log('\n═══════════════════════════════════════');
  console.log('BUSINESS_EMPLOYEE TABLE COLUMNS:');
  console.log('═══════════════════════════════════════');
  const [empCols] = await connection.query("SHOW COLUMNS FROM business_employee");
  empCols.forEach(col => console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`));

  // Check business_manager table
  console.log('\n═══════════════════════════════════════');
  console.log('BUSINESS_MANAGER TABLE COLUMNS:');
  console.log('═══════════════════════════════════════');
  const [mgrCols] = await connection.query("SHOW COLUMNS FROM business_manager");
  mgrCols.forEach(col => console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`));

  // Check staff_activity_log table
  console.log('\n═══════════════════════════════════════');
  console.log('STAFF_ACTIVITY_LOG TABLE COLUMNS:');
  console.log('═══════════════════════════════════════');
  const [logCols] = await connection.query("SHOW COLUMNS FROM staff_activity_log");
  logCols.forEach(col => console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(nullable)' : '(required)'}`));

  // Check current data
  console.log('\n═══════════════════════════════════════');
  console.log('CURRENT INSPECTOR DATA:');
  console.log('═══════════════════════════════════════');
  const [inspectors] = await connection.query("SELECT inspector_id, first_name, last_name, last_login FROM inspector");
  console.table(inspectors);

  console.log('\n═══════════════════════════════════════');
  console.log('CURRENT COLLECTOR DATA:');
  console.log('═══════════════════════════════════════');
  const [collectors] = await connection.query("SELECT collector_id, first_name, last_name, last_login FROM collector");
  console.table(collectors);

  console.log('\n═══════════════════════════════════════');
  console.log('RECENT ACTIVITY LOGS (mobile_app):');
  console.log('═══════════════════════════════════════');
  const [logs] = await connection.query("SELECT log_id, staff_name, action_type, module, created_at FROM staff_activity_log WHERE module = 'mobile_app' ORDER BY created_at DESC LIMIT 10");
  console.table(logs);

  await connection.end();
}

checkSchema().catch(e => console.error('Error:', e.message));
