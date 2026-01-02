-- =====================================================
-- FIX TIMEZONE FOR ALL SESSION PROCEDURES
-- This script fixes the "8 hours ago" problem by using Philippine timezone
-- Run this script to fix all mobile and web login/logout time issues
-- Created: 2026-01-02
-- =====================================================

USE naga_stall;

-- First, set the session timezone to Philippine Time
SET time_zone = '+08:00';

-- =====================================================
-- STEP 1: Create a function to get Philippine time reliably
-- =====================================================

DELIMITER //

DROP FUNCTION IF EXISTS fn_philippine_now//
CREATE FUNCTION fn_philippine_now()
RETURNS DATETIME
DETERMINISTIC
BEGIN
    -- Convert current UTC time to Philippine time (+08:00)
    RETURN CONVERT_TZ(UTC_TIMESTAMP(), '+00:00', '+08:00');
END//

-- =====================================================
-- STEP 2: Fix sp_createOrUpdateEmployeeSession (Web Login)
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
    DECLARE v_ph_time DATETIME;
    
    -- Get Philippine time
    SET v_ph_time = fn_philippine_now();
    
    -- Check if there's any existing session (active or inactive)
    SELECT COUNT(*) INTO v_existing_session 
    FROM employee_session 
    WHERE business_employee_id = p_employee_id;
    
    IF v_existing_session > 0 THEN
        -- Update existing session with NEW login time and last_activity
        UPDATE employee_session 
        SET session_token = p_session_token,
            ip_address = p_ip_address,
            user_agent = p_user_agent,
            login_time = v_ph_time,
            last_activity = v_ph_time,
            is_active = 1,
            logout_time = NULL
        WHERE business_employee_id = p_employee_id;
    ELSE
        -- Create new session
        INSERT INTO employee_session 
            (business_employee_id, session_token, ip_address, user_agent, login_time, last_activity, is_active, logout_time)
        VALUES 
            (p_employee_id, p_session_token, p_ip_address, p_user_agent, v_ph_time, v_ph_time, 1, NULL);
    END IF;
    
    -- Also update business_employee is_active flag
    UPDATE business_employee SET is_active = 1 WHERE business_employee_id = p_employee_id;
    
    SELECT 'success' as status, p_employee_id as employee_id, v_ph_time as login_time;
END//

-- =====================================================
-- STEP 3: Fix sp_endEmployeeSession (Web Logout)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_endEmployeeSession//
CREATE PROCEDURE sp_endEmployeeSession(
    IN p_employee_id INT
)
BEGIN
    DECLARE v_ph_time DATETIME;
    
    -- Get Philippine time
    SET v_ph_time = fn_philippine_now();
    
    UPDATE employee_session 
    SET is_active = 0, 
        logout_time = v_ph_time,
        last_activity = v_ph_time
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    -- Also update business_employee is_active flag
    UPDATE business_employee SET is_active = 0 WHERE business_employee_id = p_employee_id;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- =====================================================
-- STEP 4: Fix sp_updateBusinessEmployeeLastLoginNow
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLoginNow//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLoginNow(IN p_id INT)
BEGIN
    DECLARE v_ph_time DATETIME;
    SET v_ph_time = fn_philippine_now();
    
    UPDATE business_employee 
    SET last_login = v_ph_time 
    WHERE business_employee_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 5: Fix sp_updateEmployeeSessionActivity (Heartbeat)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity//
CREATE PROCEDURE sp_updateEmployeeSessionActivity(
    IN p_employee_id INT
)
BEGIN
    DECLARE v_ph_time DATETIME;
    SET v_ph_time = fn_philippine_now();
    
    UPDATE employee_session 
    SET last_activity = v_ph_time
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 6: Fix sp_createOrUpdateStaffSession (Mobile Login for Inspector/Collector)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_createOrUpdateStaffSession//
CREATE PROCEDURE sp_createOrUpdateStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(20),
    IN p_session_token VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_existing_session INT DEFAULT 0;
    DECLARE v_ph_time DATETIME;
    
    -- Get Philippine time
    SET v_ph_time = fn_philippine_now();
    
    -- Check if there's any existing session
    SELECT COUNT(*) INTO v_existing_session 
    FROM staff_session 
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type;
    
    IF v_existing_session > 0 THEN
        UPDATE staff_session 
        SET session_token = p_session_token,
            ip_address = p_ip_address,
            user_agent = p_user_agent,
            login_time = v_ph_time,
            last_activity = v_ph_time,
            is_active = 1,
            logout_time = NULL
        WHERE staff_id = p_staff_id AND staff_type = p_staff_type;
    ELSE
        INSERT INTO staff_session 
            (staff_id, staff_type, session_token, ip_address, user_agent, login_time, last_activity, is_active)
        VALUES 
            (p_staff_id, p_staff_type, p_session_token, p_ip_address, p_user_agent, v_ph_time, v_ph_time, 1);
    END IF;
    
    SELECT 'success' as status, p_staff_id as staff_id, v_ph_time as login_time;
END//

-- =====================================================
-- STEP 7: Fix sp_endStaffSession (Mobile Logout)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_endStaffSession//
CREATE PROCEDURE sp_endStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(20)
)
BEGIN
    DECLARE v_ph_time DATETIME;
    SET v_ph_time = fn_philippine_now();
    
    UPDATE staff_session 
    SET is_active = 0, 
        logout_time = v_ph_time,
        last_activity = v_ph_time
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    -- Update the inspector/collector table is_active if needed
    IF p_staff_type = 'inspector' THEN
        UPDATE inspector SET is_active = 0 WHERE inspector_id = p_staff_id;
    ELSEIF p_staff_type = 'collector' THEN
        UPDATE collector SET is_active = 0 WHERE collector_id = p_staff_id;
    END IF;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- =====================================================
-- STEP 8: Fix sp_updateStaffSessionActivity (Mobile Heartbeat)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateStaffSessionActivity//
CREATE PROCEDURE sp_updateStaffSessionActivity(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(20)
)
BEGIN
    DECLARE v_ph_time DATETIME;
    SET v_ph_time = fn_philippine_now();
    
    UPDATE staff_session 
    SET last_activity = v_ph_time
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 9: Fix sp_updateInspectorLastLogin
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogin//
CREATE PROCEDURE sp_updateInspectorLastLogin(
    IN p_inspector_id INT
)
BEGIN
    DECLARE v_ph_time DATETIME;
    SET v_ph_time = fn_philippine_now();
    
    UPDATE inspector 
    SET last_login = v_ph_time 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 10: Fix sp_updateCollectorLastLogin
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogin//
CREATE PROCEDURE sp_updateCollectorLastLogin(
    IN p_collector_id INT
)
BEGIN
    DECLARE v_ph_time DATETIME;
    SET v_ph_time = fn_philippine_now();
    
    UPDATE collector 
    SET last_login = v_ph_time 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 11: Fix sp_updateInspectorLastLogout
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogout//
CREATE PROCEDURE sp_updateInspectorLastLogout(
    IN p_inspector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    DECLARE v_ph_time DATETIME;
    -- Use provided time or current Philippine time
    SET v_ph_time = COALESCE(p_logout_time, fn_philippine_now());
    
    UPDATE inspector 
    SET last_logout = v_ph_time 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 12: Fix sp_updateCollectorLastLogout
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogout//
CREATE PROCEDURE sp_updateCollectorLastLogout(
    IN p_collector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    DECLARE v_ph_time DATETIME;
    -- Use provided time or current Philippine time
    SET v_ph_time = COALESCE(p_logout_time, fn_philippine_now());
    
    UPDATE collector 
    SET last_logout = v_ph_time 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 13: Fix sp_updateBusinessEmployeeLastLogout
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLogout//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLogout(
    IN p_employee_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    DECLARE v_ph_time DATETIME;
    -- Use provided time or current Philippine time
    SET v_ph_time = COALESCE(p_logout_time, fn_philippine_now());
    
    UPDATE business_employee 
    SET last_logout = v_ph_time 
    WHERE business_employee_id = p_employee_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

-- =====================================================
-- STEP 14: Reset ALL active sessions to fix current bad data
-- =====================================================

SET SQL_SAFE_UPDATES = 0;

-- Reset all employee sessions - they will get correct time on next login
UPDATE employee_session SET is_active = 0 WHERE session_id > 0;

-- Reset all staff sessions
UPDATE staff_session SET is_active = 0 WHERE session_id > 0;

SET SQL_SAFE_UPDATES = 1;

-- =====================================================
-- STEP 15: Verify the fix by testing the function
-- =====================================================

SELECT 'Testing Philippine time function:' as info;
SELECT 
    UTC_TIMESTAMP() as utc_time,
    fn_philippine_now() as philippine_time,
    NOW() as server_now,
    @@session.time_zone as session_tz,
    @@global.time_zone as global_tz;

SELECT '✅ Timezone fix applied successfully!' as status;
SELECT '📝 All users will need to login again to get correct timestamps.' as note;
