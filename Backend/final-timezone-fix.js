import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false }
  });
  
  console.log('🔧 FINAL FIX: Remove CONVERT_TZ and use consistent NOW()...\n');
  
  // 1. Update sp_getActiveSessionsAll - remove CONVERT_TZ
  console.log('1️⃣ Updating sp_getActiveSessionsAll to use raw times...');
  await connection.query(`DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll`);
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
            ss.staff_type as user_type,
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
  console.log('✅ Updated sp_getActiveSessionsAll');
  
  // 2. Update sp_createOrUpdateEmployeeSession to use NOW() instead of CURRENT_TIMESTAMP
  console.log('2️⃣ Updating sp_createOrUpdateEmployeeSession to use NOW()...');
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
        WHERE business_employee_id = p_employee_id;

        IF v_existing_session > 0 THEN
            UPDATE employee_session
            SET session_token = p_session_token,
                ip_address = p_ip_address,
                user_agent = p_user_agent,
                login_time = NOW(),
                last_activity = NOW(),
                is_active = 1,
                logout_time = NULL
            WHERE business_employee_id = p_employee_id;
        ELSE
            INSERT INTO employee_session
                (business_employee_id, session_token, ip_address, user_agent, login_time, last_activity, is_active, logout_time)
            VALUES
                (p_employee_id, p_session_token, p_ip_address, p_user_agent, NOW(), NOW(), 1, NULL);
        END IF;

        SELECT 'success' as status, p_employee_id as employee_id;
    END
  `);
  console.log('✅ Updated sp_createOrUpdateEmployeeSession');
  
  // 3. Update sp_endEmployeeSession to use NOW()
  console.log('3️⃣ Updating sp_endEmployeeSession to use NOW()...');
  await connection.query(`DROP PROCEDURE IF EXISTS sp_endEmployeeSession`);
  await connection.query(`
    CREATE PROCEDURE sp_endEmployeeSession(
        IN p_employee_id INT
    )
    BEGIN
        UPDATE employee_session
        SET is_active = 0,
            logout_time = NOW()
        WHERE business_employee_id = p_employee_id
          AND is_active = 1;
        
        SELECT ROW_COUNT() as sessions_ended;
    END
  `);
  console.log('✅ Updated sp_endEmployeeSession');
  
  // 4. Fix existing session data to use consistent timezone
  console.log('4️⃣ Syncing existing session times to NOW()...');
  await connection.query(`
    UPDATE employee_session 
    SET last_activity = NOW() 
    WHERE is_active = 1
  `);
  await connection.query(`
    UPDATE staff_session 
    SET last_activity = NOW() 
    WHERE is_active = 1
  `);
  console.log('✅ Synced session times');
  
  console.log('\n📊 Testing the fix...');
  const [test] = await connection.query(`CALL sp_getActiveSessionsAll()`);
  const sessions = test[0];
  
  const now = new Date();
  console.log(`Current time: ${now.toLocaleString()}\n`);
  
  sessions.forEach(s => {
    console.log(`${s.first_name} ${s.last_name} (${s.user_type})`);
    console.log(`  login_time: ${s.login_time}`);
    console.log(`  last_activity: ${s.last_activity}`);
    console.log(`  is_active: ${s.is_active}\n`);
  });
  
  await connection.end();
  console.log('✅ All done! Now login/logout to test with fresh data.');
})();
