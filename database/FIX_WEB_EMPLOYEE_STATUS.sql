-- =====================================================
-- FIX WEB EMPLOYEE ONLINE STATUS AND LAST ACTIVITY
-- Run this script to fix the dashboard showing wrong times
-- Created: 2026-01-02
-- =====================================================

USE naga_stall;

-- =====================================================
-- STEP 1: Fix the stored procedure for creating/updating employee sessions
-- This must update login_time and last_activity properly
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_createOrUpdateEmployeeSession//
CREATE PROCEDURE sp_createOrUpdateEmployeeSession(
    IN p_employee_id INT,
    IN p_session_token VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_existing_session INT DEFAULT 0;
    
    -- Check if there's an active session
    SELECT COUNT(*) INTO v_existing_session 
    FROM employee_session 
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    IF v_existing_session > 0 THEN
        -- Update existing session with NEW login time and last_activity
        UPDATE employee_session 
        SET session_token = p_session_token,
            ip_address = p_ip_address,
            user_agent = p_user_agent,
            login_time = CURRENT_TIMESTAMP,      -- Reset login time on new login
            last_activity = CURRENT_TIMESTAMP,   -- Reset last activity on new login
            is_active = 1,
            logout_time = NULL
        WHERE business_employee_id = p_employee_id AND is_active = 1;
    ELSE
        -- Create new session
        INSERT INTO employee_session 
            (business_employee_id, session_token, ip_address, user_agent, login_time, last_activity, is_active, logout_time)
        VALUES 
            (p_employee_id, p_session_token, p_ip_address, p_user_agent, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 1, NULL);
    END IF;
    
    SELECT 'success' as status, p_employee_id as employee_id;
END//

-- =====================================================
-- STEP 2: Fix the stored procedure for ending employee sessions
-- =====================================================

DROP PROCEDURE IF EXISTS sp_endEmployeeSession//
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
END//

-- =====================================================
-- STEP 3: Create procedure to update last_login on business_employee
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLoginNow//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLoginNow(IN p_id INT)
BEGIN
    UPDATE business_employee 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE business_employee_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 4: Create procedure for session activity update
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity//
CREATE PROCEDURE sp_updateEmployeeSessionActivity(
    IN p_employee_id INT
)
BEGIN
    UPDATE employee_session 
    SET last_activity = CURRENT_TIMESTAMP
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

-- =====================================================
-- STEP 5: Reset current stale session data
-- =====================================================

-- Mark existing stale session as inactive
UPDATE employee_session 
SET is_active = 0, 
    logout_time = CURRENT_TIMESTAMP
WHERE is_active = 1 
  AND last_activity < DATE_SUB(NOW(), INTERVAL 8 HOUR);

-- =====================================================
-- STEP 6: Verify the fix
-- =====================================================

SELECT 'Stored procedures updated successfully!' as status;

-- Show current employee sessions
SELECT 'Current employee sessions:' as info;
SELECT session_id, business_employee_id, is_active, login_time, last_activity, logout_time 
FROM employee_session 
ORDER BY session_id DESC 
LIMIT 5;
