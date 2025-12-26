import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function checkTimes() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
    port: parseInt(process.env.DB_PORT) || 25060,
    user: process.env.DB_USER || 'doadmin',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'naga_stall',
    ssl: { rejectUnauthorized: false }
  });

  console.log('\n📊 Current Inspector/Collector Login Times:\n');
  
  const [employees] = await connection.query(`
    SELECT inspector_id as id, first_name, last_name, last_login, 'Inspector' as role 
    FROM inspector WHERE last_login IS NOT NULL
    UNION ALL 
    SELECT collector_id as id, first_name, last_name, last_login, 'Collector' as role 
    FROM collector WHERE last_login IS NOT NULL
    ORDER BY last_login DESC LIMIT 10
  `);
  
  console.table(employees.map(e => ({
    Name: `${e.first_name} ${e.last_name}`,
    Role: e.role,
    LastLogin: e.last_login ? new Date(e.last_login).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'Never'
  })));

  console.log('\n📋 Recent Mobile Activity Logs:\n');
  
  const [logs] = await connection.query(`
    SELECT user_name, action, module, created_at 
    FROM staff_activity_log 
    WHERE module = 'mobile_app'
    ORDER BY created_at DESC LIMIT 10
  `);
  
  console.table(logs.map(l => ({
    User: l.user_name,
    Action: l.action,
    Time: l.created_at ? new Date(l.created_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'Unknown'
  })));

  await connection.end();
}

checkTimes().catch(e => console.error('Error:', e.message));
