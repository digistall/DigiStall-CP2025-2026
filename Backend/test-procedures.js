/**
 * Test the stored procedures and check their output
 */

import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '.env') });

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'naga_stall',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
};

async function testProcedures() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Test 1: Check sp_getInspectorByUsername procedure
        console.log('📋 Testing sp_getInspectorByUsername with INS1731...');
        try {
            const [result] = await connection.execute('CALL sp_getInspectorByUsername(?)', ['INS1731']);
            console.log('Result:', JSON.stringify(result[0], null, 2));
            
            if (result[0] && result[0].length > 0) {
                const row = result[0][0];
                console.log('\nColumn names:', Object.keys(row));
                console.log('Has inspector_id?', 'inspector_id' in row);
                console.log('Has staff_id?', 'staff_id' in row);
            }
        } catch (err) {
            console.log('Error:', err.message);
        }

        // Test 2: Check sp_getActiveSessionsAll procedure
        console.log('\n📋 Testing sp_getActiveSessionsAll...');
        try {
            const [result] = await connection.execute('CALL sp_getActiveSessionsAll()');
            console.log('Result count:', result[0]?.length || 0);
            if (result[0] && result[0].length > 0) {
                console.log('Sample:', JSON.stringify(result[0][0], null, 2));
            }
        } catch (err) {
            console.log('Error:', err.message);
        }

        // Test 3: Check if inspector exists
        console.log('\n📋 Checking inspector with username INS1731...');
        try {
            const [result] = await connection.execute('SELECT inspector_id, username, first_name, last_name, status FROM inspector WHERE username = ?', ['INS1731']);
            console.log('Direct query result:', JSON.stringify(result, null, 2));
        } catch (err) {
            console.log('Error:', err.message);
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

testProcedures();
