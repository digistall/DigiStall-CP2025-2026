import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

const dbConfig = {
  host: process.env.DB_HOST || 'dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com',
  port: process.env.DB_PORT || 25060,
  user: process.env.DB_USER || 'doadmin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'naga_stall',
  ssl: { rejectUnauthorized: false }
};

async function resetPassword() {
  let connection;
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database');

    const newPassword = 'collector123';
    console.log(`\n🔐 Generating bcrypt hash for password: "${newPassword}"`);
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    console.log('✅ Hash generated:', hashedPassword);

    // Update the password
    console.log('\n🔄 Updating password for COL6806...');
    const [result] = await connection.execute(
      'UPDATE collector SET password_hash = ? WHERE username = ?',
      [hashedPassword, 'COL6806']
    );

    if (result.affectedRows > 0) {
      console.log('✅ Password updated successfully!');
      
      // Verify the update
      console.log('\n🔍 Verifying password...');
      const [[collector]] = await connection.execute(
        'SELECT username, password_hash FROM collector WHERE username = ?',
        ['COL6806']
      );
      
      console.log('📋 Collector:', collector.username);
      console.log('🔑 New hash:', collector.password_hash);
      
      // Test the password
      const isValid = await bcrypt.compare(newPassword, collector.password_hash);
      console.log(`\n🧪 Password test: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (isValid) {
        console.log('\n🎉 Password reset complete!');
        console.log('📱 Login credentials:');
        console.log('   Username: COL6806');
        console.log('   Password: collector123');
      } else {
        console.log('\n⚠️ Warning: Password verification failed!');
      }
    } else {
      console.log('❌ No rows updated. Collector not found.');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

resetPassword();
