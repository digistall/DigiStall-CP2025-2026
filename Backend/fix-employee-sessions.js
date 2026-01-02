import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Check if using cloud database
const isCloudDB = process.env.DB_SSL === 'true' || process.env.DB_HOST?.includes('ondigitalocean.com');

async function fixEmployeeSessions() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'naga_stall',
        multipleStatements: true,
        ...(isCloudDB && {
            ssl: { rejectUnauthorized: false }
        })
    });

    console.log('🔧 Fixing employee session stored procedures...\n');

    // Drop and recreate sp_createOrUpdateEmployeeSession
    console.log('1️⃣ Updating sp_createOrUpdateEmployeeSession...');
    await connection.query(`DROP PROCEDURE IF EXISTS sp_createOrUpdateEmployeeSession`);
    await connection.query(`
        CREATE PROCEDURE sp_createOrUpdateEmployeeSession(
            IN p_employee_id INT,
            IN p_session_token VARCHAR(255),
            IN p_ip_address VARCHAR(45),
            IN p_user_agent TEXT
        )
        BEGIN
            DECLARE v_existing_session INT DEFAULT 0;
            
            SELECT COUNT(*) INTO v_existing_session 
            FROM employee_session 
            WHERE business_employee_id = p_employee_id AND is_active = 1;
            
            IF v_existing_session > 0 THEN
                UPDATE employee_session 
                SET session_token = p_session_token,
                    ip_address = p_ip_address,
                    user_agent = p_user_agent,
                    login_time = CURRENT_TIMESTAMP,
                    last_activity = CURRENT_TIMESTAMP,
                    is_active = 1,
                    logout_time = NULL
                WHERE business_employee_id = p_employee_id AND is_active = 1;
            ELSE
                INSERT INTO employee_session 
                    (business_employee_id, session_token, ip_address, user_agent, login_time, last_activity, is_active, logout_time)
                VALUES 
                    (p_employee_id, p_session_token, p_ip_address, p_user_agent, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, NULL);
            END IF;
            
            SELECT 'success' as status, p_employee_id as employee_id;
        END
    `);
    console.log('   ✅ Done');

    // Drop and recreate sp_endEmployeeSession
    console.log('2️⃣ Updating sp_endEmployeeSession...');
    await connection.query(`DROP PROCEDURE IF EXISTS sp_endEmployeeSession`);
    await connection.query(`
        CREATE PROCEDURE sp_endEmployeeSession(
            IN p_employee_id INT
        )
        BEGIN
            UPDATE employee_session 
            SET is_active = 0, 
                logout_time = CURRENT_TIMESTAMP,
                last_activity = CURRENT_TIMESTAMP
            WHERE business_employee_id = p_employee_id AND is_active = 1;
            
            SELECT ROW_COUNT() as sessions_ended;
        END
    `);
    console.log('   ✅ Done');

    // Update sp_updateBusinessEmployeeLastLoginNow
    console.log('3️⃣ Updating sp_updateBusinessEmployeeLastLoginNow...');
    await connection.query(`DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLoginNow`);
    await connection.query(`
        CREATE PROCEDURE sp_updateBusinessEmployeeLastLoginNow(IN p_id INT)
        BEGIN
            UPDATE business_employee 
            SET last_login = CURRENT_TIMESTAMP 
            WHERE business_employee_id = p_id;
            
            SELECT ROW_COUNT() as affected_rows;
        END
    `);
    console.log('   ✅ Done');

    // Update sp_updateEmployeeSessionActivity
    console.log('4️⃣ Updating sp_updateEmployeeSessionActivity...');
    await connection.query(`DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity`);
    await connection.query(`
        CREATE PROCEDURE sp_updateEmployeeSessionActivity(
            IN p_employee_id INT
        )
        BEGIN
            UPDATE employee_session 
            SET last_activity = CURRENT_TIMESTAMP
            WHERE business_employee_id = p_employee_id AND is_active = 1;
            
            SELECT ROW_COUNT() as affected_rows;
        END
    `);
    console.log('   ✅ Done');

    // Reset stale sessions
    console.log('5️⃣ Deactivating stale sessions (older than 8 hours)...');
    const [staleResult] = await connection.query(`
        UPDATE employee_session 
        SET is_active = 0, logout_time = CURRENT_TIMESTAMP
        WHERE is_active = 1 AND last_activity < DATE_SUB(NOW(), INTERVAL 8 HOUR)
    `);
    console.log(`   ✅ Deactivated ${staleResult.affectedRows} stale sessions`);

    // Also deactivate any session where user has already logged out
    console.log('6️⃣ Syncing sessions with logout times...');
    const [syncResult] = await connection.query(`
        UPDATE employee_session es
        INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
        SET es.is_active = 0, es.logout_time = be.last_logout
        WHERE es.is_active = 1 
          AND be.last_logout IS NOT NULL 
          AND be.last_logout > be.last_login
    `);
    console.log(`   ✅ Synced ${syncResult.affectedRows} sessions with logout times`);

    // Verify
    console.log('\n=== VERIFICATION ===');
    const [sessions] = await connection.query(`
        SELECT session_id, business_employee_id, is_active, login_time, last_activity, logout_time
        FROM employee_session ORDER BY session_id DESC LIMIT 5
    `);
    console.log('Current employee sessions:');
    sessions.forEach(s => console.log(s));

    await connection.end();
    console.log('\n✅ All fixes applied successfully!');
}

fixEmployeeSessions().catch(console.error);
