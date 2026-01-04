/**
 * Check table collations and fix them
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

async function fixAllCollations() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Check collations
        console.log('📋 Checking table collations...\n');

        const tablesToCheck = ['employee_session', 'staff_session', 'business_employee', 'inspector', 'collector', 'branch'];
        
        for (const table of tablesToCheck) {
            try {
                const [result] = await connection.execute(`SHOW TABLE STATUS WHERE Name = ?`, [table]);
                if (result[0]) {
                    console.log(`${table}: ${result[0].Collation}`);
                }
            } catch (err) {
                console.log(`${table}: Error - ${err.message}`);
            }
        }

        // Convert staff_session to utf8mb4_unicode_ci
        console.log('\n🔧 Fixing staff_session table collation...');
        try {
            await connection.query(`ALTER TABLE staff_session CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            console.log('   ✅ staff_session converted');
        } catch (err) {
            console.log('   Error:', err.message);
        }

        // Convert employee_session to utf8mb4_unicode_ci
        console.log('🔧 Fixing employee_session table collation...');
        try {
            await connection.query(`ALTER TABLE employee_session CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
            console.log('   ✅ employee_session converted');
        } catch (err) {
            console.log('   Error:', err.message);
        }

        // Drop and recreate the procedure with explicit conversion
        console.log('\n🔧 Recreating sp_getActiveSessionsAll with CONVERT...');
        
        await connection.query('DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll');
        
        await connection.query(`
            CREATE PROCEDURE sp_getActiveSessionsAll()
            BEGIN
                SELECT 
                    es.session_id,
                    es.business_employee_id as user_id,
                    'employee' as user_type,
                    es.is_active,
                    es.login_time,
                    es.last_activity,
                    es.logout_time,
                    CONVERT(be.first_name USING utf8mb4) as first_name,
                    CONVERT(be.last_name USING utf8mb4) as last_name,
                    be.branch_id,
                    CONVERT(be.email USING utf8mb4) as email,
                    CONVERT(b.branch_name USING utf8mb4) as branch_name
                FROM employee_session es
                INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
                LEFT JOIN branch b ON be.branch_id = b.branch_id
                WHERE es.is_active = 1 
                   OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                
                UNION ALL
                
                SELECT 
                    ss.session_id,
                    ss.staff_id as user_id,
                    CONVERT(ss.staff_type USING utf8mb4) as user_type,
                    ss.is_active,
                    ss.login_time,
                    ss.last_activity,
                    ss.logout_time,
                    CONVERT(CASE 
                        WHEN ss.staff_type = 'inspector' THEN i.first_name
                        ELSE c.first_name
                    END USING utf8mb4) as first_name,
                    CONVERT(CASE 
                        WHEN ss.staff_type = 'inspector' THEN i.last_name
                        ELSE c.last_name
                    END USING utf8mb4) as last_name,
                    CASE 
                        WHEN ss.staff_type = 'inspector' THEN ia.branch_id
                        ELSE ca.branch_id
                    END as branch_id,
                    CONVERT(CASE 
                        WHEN ss.staff_type = 'inspector' THEN i.email
                        ELSE c.email
                    END USING utf8mb4) as email,
                    CONVERT(b.branch_name USING utf8mb4) as branch_name
                FROM staff_session ss
                LEFT JOIN inspector i ON ss.staff_id = i.inspector_id AND ss.staff_type = 'inspector'
                LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
                LEFT JOIN collector c ON ss.staff_id = c.collector_id AND ss.staff_type = 'collector'
                LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
                LEFT JOIN branch b ON (ia.branch_id = b.branch_id OR ca.branch_id = b.branch_id)
                WHERE ss.is_active = 1 
                   OR ss.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                
                ORDER BY last_activity DESC;
            END
        `);
        console.log('   ✅ sp_getActiveSessionsAll recreated');

        // Test the procedure
        console.log('\n📋 Testing sp_getActiveSessionsAll...');
        try {
            const [result] = await connection.execute('CALL sp_getActiveSessionsAll()');
            console.log('✅ Success! Result count:', result[0]?.length || 0);
        } catch (err) {
            console.log('❌ Error:', err.message);
        }

        console.log('\n✅ Done!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixAllCollations();
