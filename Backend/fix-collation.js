/**
 * Fix the collation issue in sp_getActiveSessionsAll
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

async function fixCollation() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        // Drop and recreate sp_getActiveSessionsAll with explicit collation casting
        console.log('🔧 Fixing sp_getActiveSessionsAll...');
        
        await connection.query('DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll');
        
        await connection.query(`
            CREATE PROCEDURE sp_getActiveSessionsAll()
            BEGIN
                SELECT 
                    es.session_id,
                    es.business_employee_id as user_id,
                    CAST('employee' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_general_ci as user_type,
                    es.is_active,
                    es.login_time,
                    es.last_activity,
                    es.logout_time,
                    be.first_name,
                    be.last_name,
                    be.branch_id,
                    be.email,
                    b.branch_name
                FROM employee_session es
                INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
                LEFT JOIN branch b ON be.branch_id = b.branch_id
                WHERE es.is_active = 1 
                   OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
                
                UNION ALL
                
                SELECT 
                    ss.session_id,
                    ss.staff_id as user_id,
                    CAST(ss.staff_type AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_general_ci as user_type,
                    ss.is_active,
                    ss.login_time,
                    ss.last_activity,
                    ss.logout_time,
                    CASE 
                        WHEN ss.staff_type = 'inspector' THEN i.first_name
                        ELSE c.first_name
                    END as first_name,
                    CASE 
                        WHEN ss.staff_type = 'inspector' THEN i.last_name
                        ELSE c.last_name
                    END as last_name,
                    CASE 
                        WHEN ss.staff_type = 'inspector' THEN ia.branch_id
                        ELSE ca.branch_id
                    END as branch_id,
                    CASE 
                        WHEN ss.staff_type = 'inspector' THEN i.email
                        ELSE c.email
                    END as email,
                    b.branch_name
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
        console.log('   ✅ sp_getActiveSessionsAll fixed');

        // Also fix sp_getActiveSessionsByBranches
        console.log('🔧 Fixing sp_getActiveSessionsByBranches...');
        
        await connection.query('DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches');
        
        await connection.query(`
            CREATE PROCEDURE sp_getActiveSessionsByBranches(IN p_branch_ids VARCHAR(500))
            BEGIN
                SET @sql = CONCAT('
                    SELECT 
                        es.session_id,
                        es.business_employee_id as user_id,
                        CAST(''employee'' AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_general_ci as user_type,
                        es.is_active,
                        es.login_time,
                        es.last_activity,
                        es.logout_time,
                        be.first_name,
                        be.last_name,
                        be.branch_id,
                        be.email,
                        b.branch_name
                    FROM employee_session es
                    INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
                    LEFT JOIN branch b ON be.branch_id = b.branch_id
                    WHERE be.branch_id IN (', p_branch_ids, ')
                    AND (es.is_active = 1 OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
                    
                    UNION ALL
                    
                    SELECT 
                        ss.session_id,
                        ss.staff_id as user_id,
                        CAST(ss.staff_type AS CHAR(20) CHARACTER SET utf8mb4) COLLATE utf8mb4_general_ci as user_type,
                        ss.is_active,
                        ss.login_time,
                        ss.last_activity,
                        ss.logout_time,
                        CASE 
                            WHEN ss.staff_type = ''inspector'' THEN i.first_name
                            ELSE c.first_name
                        END as first_name,
                        CASE 
                            WHEN ss.staff_type = ''inspector'' THEN i.last_name
                            ELSE c.last_name
                        END as last_name,
                        CASE 
                            WHEN ss.staff_type = ''inspector'' THEN ia.branch_id
                            ELSE ca.branch_id
                        END as branch_id,
                        CASE 
                            WHEN ss.staff_type = ''inspector'' THEN i.email
                            ELSE c.email
                        END as email,
                        b.branch_name
                    FROM staff_session ss
                    LEFT JOIN inspector i ON ss.staff_id = i.inspector_id AND ss.staff_type = ''inspector''
                    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = ''Active''
                    LEFT JOIN collector c ON ss.staff_id = c.collector_id AND ss.staff_type = ''collector''
                    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = ''Active''
                    LEFT JOIN branch b ON (ia.branch_id = b.branch_id OR ca.branch_id = b.branch_id)
                    WHERE (ia.branch_id IN (', p_branch_ids, ') OR ca.branch_id IN (', p_branch_ids, '))
                    AND (ss.is_active = 1 OR ss.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
                    
                    ORDER BY last_activity DESC'
                );
                
                PREPARE stmt FROM @sql;
                EXECUTE stmt;
                DEALLOCATE PREPARE stmt;
            END
        `);
        console.log('   ✅ sp_getActiveSessionsByBranches fixed');

        // Test the fixed procedure
        console.log('\n📋 Testing fixed sp_getActiveSessionsAll...');
        try {
            const [result] = await connection.execute('CALL sp_getActiveSessionsAll()');
            console.log('✅ Works! Result count:', result[0]?.length || 0);
            if (result[0] && result[0].length > 0) {
                console.log('Sample:', JSON.stringify(result[0][0], null, 2));
            }
        } catch (err) {
            console.log('❌ Still has error:', err.message);
        }

        console.log('\n✅ ALL COLLATION FIXES APPLIED!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

fixCollation();
