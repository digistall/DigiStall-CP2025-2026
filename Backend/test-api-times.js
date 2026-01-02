import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('🔍 Testing what the API sees from sp_getActiveSessionsAll...\n');
  
  const [results] = await connection.query(`CALL sp_getActiveSessionsAll()`);
  const sessions = results[0];
  
  console.log(`Found ${sessions.length} active sessions:\n`);
  
  const now = new Date();
  console.log(`Current time: ${now.toLocaleString()}\n`);
  
  sessions.forEach((session, index) => {
    console.log(`${index + 1}. ${session.first_name} ${session.last_name} (${session.user_type.toUpperCase()})`);
    console.log(`   Status: ${session.is_active ? 'ONLINE' : 'OFFLINE'}`);
    console.log(`   login_time: ${session.login_time}`);
    console.log(`   last_activity: ${session.last_activity}`);
    
    // Calculate time difference
    const activityTime = new Date(session.last_activity);
    const diffMs = now - activityTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    
    let timeAgo;
    if (diffMins < 1) timeAgo = 'Just now';
    else if (diffMins < 60) timeAgo = `${diffMins}m ago`;
    else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
    else timeAgo = `${Math.floor(diffHours / 24)}d ago`;
    
    console.log(`   Time ago: ${timeAgo}`);
    console.log(`   Branch: ${session.branch_name || 'N/A'}\n`);
  });
  
  await connection.end();
})();
