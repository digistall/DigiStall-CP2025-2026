import { createConnection } from './Backend-Web/config/database.js';

async function checkSystemAdmin() {
  let connection;
  
  try {
    connection = await createConnection();
    console.log('✅ Database connected');
    
    // Check if system_administrator table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'system_administrator'"
    );
    
    if (tables.length === 0) {
      console.log('❌ system_administrator table does NOT exist');
      console.log('You need to run the migration: 024_role_system_restructure.sql');
      return;
    }
    
    console.log('✅ system_administrator table exists');
    
    // Check table structure
    const [columns] = await connection.execute(
      "DESCRIBE system_administrator"
    );
    console.log('\n📋 Table structure:');
    columns.forEach(col => {
      console.log(`  - ${col.Field} (${col.Type})`);
    });
    
    // Check if sysadmin account exists
    const [users] = await connection.execute(
      "SELECT system_admin_id, username, email, status FROM system_administrator"
    );
    
    console.log('\n👥 Existing system administrators:');
    if (users.length === 0) {
      console.log('  ❌ No system administrators found!');
      console.log('  You need to run the migration to create the default sysadmin account');
    } else {
      users.forEach(user => {
        console.log(`  - ID: ${user.system_admin_id}, Username: ${user.username}, Email: ${user.email}, Status: ${user.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) await connection.end();
  }
}

checkSystemAdmin();
