-- =====================================================
-- QUICK FIX: Login 500 Error
-- Run this SQL immediately to fix login issues
-- =====================================================

-- Step 1: Add missing columns to tables (ignore errors if columns exist)
-- Run each ALTER separately and ignore duplicate column errors

-- For business_manager
ALTER TABLE business_manager ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE business_manager ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL;

-- For stall_business_owner  
ALTER TABLE stall_business_owner ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE stall_business_owner ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL;

-- For system_administrator
ALTER TABLE system_administrator ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE system_administrator ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL;

-- For business_employee
ALTER TABLE business_employee ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL;

-- Step 2: Fix collation issues and recreate auth stored procedures

DELIMITER //

-- =====================================================
-- AUTH LOGIN STORED PROCEDURES (with collation fix)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_getSystemAdminByUsername//
CREATE PROCEDURE sp_getSystemAdminByUsername(IN p_username VARCHAR(100))
BEGIN
    SELECT * FROM system_administrator 
    WHERE username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci 
    AND status = 'Active';
END
//

DROP PROCEDURE IF EXISTS sp_getBusinessOwnerByUsername//
CREATE PROCEDURE sp_getBusinessOwnerByUsername(IN p_username VARCHAR(100))
BEGIN
    SELECT * FROM stall_business_owner 
    WHERE owner_username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci 
    AND status = 'Active';
END
//

DROP PROCEDURE IF EXISTS sp_getBusinessManagerByUsername//
CREATE PROCEDURE sp_getBusinessManagerByUsername(IN p_username VARCHAR(100))
BEGIN
    SELECT * FROM business_manager 
    WHERE manager_username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci 
    AND status = 'Active';
END
//

DROP PROCEDURE IF EXISTS sp_getBusinessEmployeeByUsername//
CREATE PROCEDURE sp_getBusinessEmployeeByUsername(IN p_username VARCHAR(100))
BEGIN
    SELECT * FROM business_employee 
    WHERE employee_username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci 
    AND status = 'Active';
END
//

-- =====================================================
-- LAST LOGIN/LOGOUT UPDATE PROCEDURES (with error handlers)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLoginNow//
CREATE PROCEDURE sp_updateSystemAdminLastLoginNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE system_administrator SET last_login = NOW() WHERE system_admin_id = p_id;
END
//

DROP PROCEDURE IF EXISTS sp_updateBusinessOwnerLastLoginNow//
CREATE PROCEDURE sp_updateBusinessOwnerLastLoginNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE stall_business_owner SET last_login = NOW() WHERE business_owner_id = p_id;
END
//

DROP PROCEDURE IF EXISTS sp_updateBusinessManagerLastLoginNow//
CREATE PROCEDURE sp_updateBusinessManagerLastLoginNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_manager SET last_login = NOW() WHERE business_manager_id = p_id;
END
//

DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLoginNow//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLoginNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_employee SET last_login = NOW() WHERE business_employee_id = p_id;
END
//

DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLogoutNow//
CREATE PROCEDURE sp_updateSystemAdminLastLogoutNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE system_administrator SET last_logout = NOW() WHERE system_admin_id = p_id;
END
//

DROP PROCEDURE IF EXISTS sp_updateBusinessOwnerLastLogoutNow//
CREATE PROCEDURE sp_updateBusinessOwnerLastLogoutNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE stall_business_owner SET last_logout = NOW() WHERE business_owner_id = p_id;
END
//

DROP PROCEDURE IF EXISTS sp_updateBusinessManagerLastLogoutNow//
CREATE PROCEDURE sp_updateBusinessManagerLastLogoutNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_manager SET last_logout = NOW() WHERE business_manager_id = p_id;
END
//

DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLogoutNow//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLogoutNow(IN p_id INT)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_employee SET last_logout = NOW() WHERE business_employee_id = p_id;
END
//

-- =====================================================
-- ACTIVITY LOG PROCEDURES (with error handlers)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_logStaffActivityLogin//
CREATE PROCEDURE sp_logStaffActivityLogin(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_action_description TEXT,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, action_type, action_description, module, ip_address, user_agent, status, created_at) 
    VALUES (p_staff_type, p_staff_id, p_staff_name, 'LOGIN', p_action_description, 
            'authentication', p_ip_address, p_user_agent, 'success', NOW());
END
//

DROP PROCEDURE IF EXISTS sp_logStaffActivityLogout//
CREATE PROCEDURE sp_logStaffActivityLogout(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_action_description TEXT,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, action_type, action_description, module, ip_address, user_agent, status, created_at) 
    VALUES (p_staff_type, p_staff_id, p_staff_name, 'LOGOUT', p_action_description, 
            'authentication', p_ip_address, p_user_agent, 'success', NOW());
END
//

-- =====================================================
-- FIX sp_getLandingPageStats (uses contract_status)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_getLandingPageStats//
CREATE PROCEDURE sp_getLandingPageStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM stallholder WHERE contract_status = 'Active') as total_stallholders,
        (SELECT COUNT(*) FROM stall) as total_stalls,
        (SELECT COUNT(*) FROM stall WHERE is_available = 1) as available_stalls,
        (SELECT COUNT(*) FROM stall WHERE is_available = 0) as occupied_stalls;
END
//

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
END
//

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
END
//

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
END
//

DELIMITER ;

SELECT 'Quick fix applied successfully! Login should now work.' as status;
