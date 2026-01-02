/**
 * Fix sp_getActiveSessionsByBranches collation issue
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

async function fixBranchesProc() {
    let connection;
    
    try {
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Connected to database\n');

        console.log('🔧 Recreating sp_getActiveSessionsByBranches with CONVERT...');
        
        await connection.query('DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches');
        
        await connection.query(`
            CREATE PROCEDURE sp_getActiveSessionsByBranches(IN p_branch_ids VARCHAR(500))
            BEGIN
                SET @sql = CONCAT('
                    SELECT 
                        es.session_id,
                        es.business_employee_id as user_id,
                        ''employee'' as user_type,
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
                    WHERE be.branch_id IN (', p_branch_ids, ')
                    AND (es.is_active = 1 OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
                    
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
                            WHEN ss.staff_type = ''inspector'' THEN i.first_name
                            ELSE c.first_name
                        END USING utf8mb4) as first_name,
                        CONVERT(CASE 
                            WHEN ss.staff_type = ''inspector'' THEN i.last_name
                            ELSE c.last_name
                        END USING utf8mb4) as last_name,
                        CASE 
                            WHEN ss.staff_type = ''inspector'' THEN ia.branch_id
                            ELSE ca.branch_id
                        END as branch_id,
                        CONVERT(CASE 
                            WHEN ss.staff_type = ''inspector'' THEN i.email
                            ELSE c.email
                        END USING utf8mb4) as email,
                        CONVERT(b.branch_name USING utf8mb4) as branch_name
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
        console.log('   ✅ sp_getActiveSessionsByBranches recreated');

        // Test the procedure with branch ID 1
        console.log('\n📋 Testing sp_getActiveSessionsByBranches...');
        try {
            const [result] = await connection.execute('CALL sp_getActiveSessionsByBranches(?)', ['1']);
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

fixBranchesProc();
