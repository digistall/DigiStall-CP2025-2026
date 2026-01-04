-- =====================================================
-- Migration 327: Employee Session Management Stored Procedures
-- Purpose: Track employee online status and last activity
-- =====================================================

DELIMITER //

-- =====================================================
-- SP: sp_createOrUpdateEmployeeSession
-- Purpose: Create or update employee session for online status tracking
-- =====================================================

DROP PROCEDURE IF EXISTS sp_createOrUpdateEmployeeSession//
CREATE PROCEDURE sp_createOrUpdateEmployeeSession(
    IN p_employee_id INT,
    IN p_session_token VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_existing_session INT DEFAULT 0;
    
    -- Check if active session exists
    SELECT COUNT(*) INTO v_existing_session 
    FROM employee_session 
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    IF v_existing_session > 0 THEN
        -- Update existing session
        UPDATE employee_session 
        SET session_token = p_session_token,
            ip_address = p_ip_address,
            user_agent = p_user_agent,
            last_activity = NOW(),
            is_active = 1,
            logout_time = NULL
        WHERE business_employee_id = p_employee_id AND is_active = 1;
    ELSE
        -- Create new session
        INSERT INTO employee_session 
            (business_employee_id, session_token, ip_address, user_agent, login_time, last_activity, is_active)
        VALUES 
            (p_employee_id, p_session_token, p_ip_address, p_user_agent, NOW(), NOW(), 1);
    END IF;
    
    SELECT 'success' as status, p_employee_id as employee_id;
END//

-- =====================================================
-- SP: sp_updateEmployeeSessionActivity
-- Purpose: Update last_activity timestamp for employee session
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity//
CREATE PROCEDURE sp_updateEmployeeSessionActivity(
    IN p_employee_id INT
)
BEGIN
    UPDATE employee_session 
    SET last_activity = NOW()
    WHERE business_employee_id = p_employee_id AND is_active = 1;
END//

-- =====================================================
-- SP: sp_endEmployeeSession
-- Purpose: End employee session on logout
-- =====================================================

DROP PROCEDURE IF EXISTS sp_endEmployeeSession//
CREATE PROCEDURE sp_endEmployeeSession(
    IN p_employee_id INT
)
BEGIN
    UPDATE employee_session 
    SET is_active = 0, 
        logout_time = NOW()
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- =====================================================
-- SP: sp_getActiveEmployeeSessions
-- Purpose: Get all active employee sessions with employee info
-- =====================================================

DROP PROCEDURE IF EXISTS sp_getActiveEmployeeSessions//
CREATE PROCEDURE sp_getActiveEmployeeSessions()
BEGIN
    SELECT 
        es.session_id,
        es.business_employee_id,
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
    ORDER BY es.last_activity DESC;
END//

-- =====================================================
-- SP: sp_getActiveEmployeeSessionsByBranch
-- Purpose: Get active employee sessions filtered by branch
-- =====================================================

DROP PROCEDURE IF EXISTS sp_getActiveEmployeeSessionsByBranch//
CREATE PROCEDURE sp_getActiveEmployeeSessionsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        es.session_id,
        es.business_employee_id,
        es.is_active,
        es.login_time,
        es.last_activity,
        es.logout_time,
        be.first_name,
        be.last_name,
        be.branch_id,
        be.email
    FROM employee_session es
    INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
    WHERE be.branch_id = p_branch_id
      AND (es.is_active = 1 OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
    ORDER BY es.last_activity DESC;
END//

DELIMITER ;

SELECT 'Migration 327: Employee session management stored procedures created successfully' as status;
