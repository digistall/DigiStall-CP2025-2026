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
  
  console.log('🔧 Fixing sp_createOrUpdateEmployeeSession to handle inactive sessions...\n');
  
  // Update the stored procedure to handle both active and inactive sessions
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

        -- Check if ANY session exists for this employee (active or inactive)
        SELECT COUNT(*) INTO v_existing_session
        FROM employee_session
        WHERE business_employee_id = p_employee_id;

        IF v_existing_session > 0 THEN
            -- Update existing session (reactivate if inactive)
            UPDATE employee_session
            SET session_token = p_session_token,
                ip_address = p_ip_address,
                user_agent = p_user_agent,
                login_time = CURRENT_TIMESTAMP,
                last_activity = CURRENT_TIMESTAMP,
                is_active = 1,
                logout_time = NULL
            WHERE business_employee_id = p_employee_id;
        ELSE
            -- Insert new session
            INSERT INTO employee_session
                (business_employee_id, session_token, ip_address, user_agent, login_time, last_activity, is_active, logout_time)
            VALUES
                (p_employee_id, p_session_token, p_ip_address, p_user_agent, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, NULL);
        END IF;

        SELECT 'success' as status, p_employee_id as employee_id;
    END
  `);
  console.log('✅ Updated sp_createOrUpdateEmployeeSession');
  
  console.log('\n📊 Verifying fix...');
  const [rows] = await connection.query(`SHOW CREATE PROCEDURE sp_createOrUpdateEmployeeSession`);
  console.log('New procedure definition:');
  console.log(rows[0]['Create Procedure']);
  
  await connection.end();
  console.log('\n✅ Done! The procedure will now properly update inactive sessions on login.');
})();
