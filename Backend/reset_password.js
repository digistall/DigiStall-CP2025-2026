const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

async function resetUserPassword() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: '',
        database: 'naga_stall'
    });

    try {
        // Generate bcrypt hash for password "lmw295"
        const newPassword = 'lmw295';
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        console.log('🔐 Generated new password hash for "lmw295":', hashedPassword);
        
        // Update the password for user 25-72198
        const [result] = await connection.execute(
            'UPDATE credential SET password_hash = ? WHERE user_name = ?',
            [hashedPassword, '25-72198']
        );
        
        console.log('✅ Password updated for user 25-72198');
        console.log('📊 Rows affected:', result.affectedRows);
        
        // Verify the update
        const [verification] = await connection.execute(
            'SELECT user_name, password_hash FROM credential WHERE user_name = ?',
            ['25-72198']
        );
        
        if (verification.length > 0) {
            console.log('🔍 Verification - Updated hash:', verification[0].password_hash.substring(0, 20) + '...');
            
            // Test the hash
            const isMatch = await bcrypt.compare(newPassword, verification[0].password_hash);
            console.log('✅ Password verification test:', isMatch ? 'PASSED' : 'FAILED');
        }
        
        console.log('\n🎯 Login Credentials:');
        console.log('   Username: 25-72198');
        console.log('   Password: lmw295');
        
    } catch (error) {
        console.error('❌ Error updating password:', error);
    } finally {
        await connection.end();
    }
}

resetUserPassword();