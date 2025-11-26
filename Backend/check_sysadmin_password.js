import { createConnection } from './Backend-Web/config/database.js';
import bcrypt from 'bcrypt';

async function checkPassword() {
  let connection;
  
  try {
    connection = await createConnection();
    console.log('✅ Database connected');
    
    // Get the sysadmin account
    const [users] = await connection.execute(
      "SELECT username, password_hash FROM system_administrator WHERE username = 'sysadmin'"
    );
    
    if (users.length === 0) {
      console.log('❌ sysadmin account not found');
      return;
    }
    
    const user = users[0];
    console.log('\n👤 User found:', user.username);
    console.log('🔑 Password hash:', user.password_hash);
    console.log('🔑 Hash starts with $2b$?', user.password_hash.startsWith('$2b$'));
    console.log('🔑 Hash length:', user.password_hash.length);
    
    // Test the password
    const testPassword = 'SysAdmin@2025';
    console.log('\n🔐 Testing password:', testPassword);
    
    const isValid = await bcrypt.compare(testPassword, user.password_hash);
    console.log('✅ Password match result:', isValid);
    
    if (!isValid) {
      console.log('\n❌ Password does NOT match!');
      console.log('Creating correct hash for SysAdmin@2025...');
      const correctHash = await bcrypt.hash(testPassword, 12);
      console.log('Correct hash:', correctHash);
      console.log('\nRun this SQL to fix:');
      console.log(`UPDATE system_administrator SET password_hash = '${correctHash}' WHERE username = 'sysadmin';`);
    } else {
      console.log('\n✅ Password is correct!');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) await connection.end();
  }
}

checkPassword();
