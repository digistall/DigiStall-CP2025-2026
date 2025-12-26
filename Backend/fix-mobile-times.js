import { createConnection } from './config/database.js';

async function fixMobileTimes() {
  let conn;
  try {
    conn = await createConnection();
    
    console.log('🔧 Fixing mobile timestamps...\n');
    
    // Fix inspector last_login times (add 8 hours to convert UTC to PH time)
    const [inspectors] = await conn.execute(
      `UPDATE inspector 
       SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR) 
       WHERE last_login IS NOT NULL 
       AND last_login < DATE_SUB(NOW(), INTERVAL 6 HOUR)`
    );
    console.log('✅ Fixed inspector records:', inspectors.affectedRows);
    
    // Fix collector last_login times
    const [collectors] = await conn.execute(
      `UPDATE collector 
       SET last_login = DATE_ADD(last_login, INTERVAL 8 HOUR) 
       WHERE last_login IS NOT NULL 
       AND last_login < DATE_SUB(NOW(), INTERVAL 6 HOUR)`
    );
    console.log('✅ Fixed collector records:', collectors.affectedRows);
    
    // Fix activity log times for mobile_app entries that are more than 6 hours behind
    const [logs] = await conn.execute(
      `UPDATE staff_activity_log 
       SET created_at = DATE_ADD(created_at, INTERVAL 8 HOUR) 
       WHERE module = 'mobile_app' 
       AND created_at < DATE_SUB(NOW(), INTERVAL 6 HOUR)`
    );
    console.log('✅ Fixed activity log records:', logs.affectedRows);
    
    console.log('\n✅ All mobile timestamps fixed!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (conn) await conn.end();
  }
}

fixMobileTimes();
