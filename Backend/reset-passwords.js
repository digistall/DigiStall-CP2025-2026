/**
 * Password Reset Utility
 * Run this with: node reset-passwords.js
 * 
 * This will reset all staff passwords to "password123"
 */

import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const NEW_PASSWORD = 'password123';

async function resetPasswords() {
    console.log('🔐 Password Reset Utility');
    console.log('========================');
    console.log(`New password will be: ${NEW_PASSWORD}`);
    console.log('');

    // Generate bcrypt hash
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
    console.log('✅ Generated bcrypt hash:', passwordHash);
    console.log('');

    // Verify the hash works
    const isValid = await bcrypt.compare(NEW_PASSWORD, passwordHash);
    console.log('✅ Verification test:', isValid ? 'PASSED' : 'FAILED');
    console.log('');

    // Connect to database
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'naga_stall'
    });

    console.log('📦 Connected to database');
    console.log('');

    try {
        // Reset collector passwords
        console.log('🔄 Resetting collector passwords...');
        const [collectors] = await connection.execute(
            'SELECT collector_id, username, first_name, last_name FROM collector'
        );
        
        for (const col of collectors) {
            await connection.execute(
                'UPDATE collector SET password_hash = ? WHERE collector_id = ?',
                [passwordHash, col.collector_id]
            );
            console.log(`   ✅ ${col.username} (${col.first_name} ${col.last_name})`);
        }
        console.log(`   Total: ${collectors.length} collectors updated`);
        console.log('');

        // Reset inspector passwords
        console.log('🔄 Resetting inspector passwords...');
        const [inspectors] = await connection.execute(
            `SELECT inspector_id, username, first_name, last_name FROM inspector WHERE status IN ('active', 'Active')`
        );
        
        for (const ins of inspectors) {
            // Inspector uses 'password' column (not password_hash)
            await connection.execute(
                'UPDATE inspector SET password = ? WHERE inspector_id = ?',
                [passwordHash, ins.inspector_id]
            );
            console.log(`   ✅ ${ins.username} (${ins.first_name} ${ins.last_name})`);
        }
        console.log(`   Total: ${inspectors.length} inspectors updated`);
        console.log('');

        // Reset stallholder credentials
        console.log('🔄 Resetting stallholder credentials...');
        const [credentials] = await connection.execute(
            'SELECT registrationid, user_name FROM credential WHERE is_active = 1'
        );
        
        // Use $2b$ prefix for stallholder (to match their existing format)
        const stallholderHash = await bcrypt.hash(NEW_PASSWORD, 10);
        
        for (const cred of credentials) {
            await connection.execute(
                'UPDATE credential SET password_hash = ? WHERE registrationid = ?',
                [stallholderHash, cred.registrationid]
            );
            console.log(`   ✅ ${cred.user_name}`);
        }
        console.log(`   Total: ${credentials.length} credentials updated`);
        console.log('');

        console.log('========================');
        console.log('✅ ALL PASSWORDS RESET TO:', NEW_PASSWORD);
        console.log('========================');
        console.log('');
        console.log('You can now login with:');
        console.log('  - Any Collector username + password123');
        console.log('  - Any Inspector username + password123');
        console.log('  - Any Stallholder username + password123');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
}

resetPasswords().catch(console.error);
