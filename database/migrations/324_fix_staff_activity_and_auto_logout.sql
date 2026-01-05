-- =============================================
-- FIX STAFF ACTIVITY LOG TABLE AND AUTO-LOGOUT LOGGING
-- Migration: 324_fix_staff_activity_and_auto_logout.sql
-- Purpose: 
--   1. Fix staff_activity_log table to include missing columns
--   2. Add auto-logout tracking procedures
--   3. Ensure all login/logout events are properly logged
-- =============================================

DELIMITER //

-- =====================================================
-- STEP 1: Ensure staff_activity_log table has all required columns
-- =====================================================

-- Add request_method column if not exists
DROP PROCEDURE IF EXISTS add_request_method_column//
CREATE PROCEDURE add_request_method_column()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'staff_activity_log' 
        AND COLUMN_NAME = 'request_method'
    ) THEN
        ALTER TABLE staff_activity_log ADD COLUMN request_method VARCHAR(10) DEFAULT NULL AFTER user_agent;
    END IF;
END//
CALL add_request_method_column()//
DROP PROCEDURE IF EXISTS add_request_method_column//

-- Add request_path column if not exists
DROP PROCEDURE IF EXISTS add_request_path_column//
CREATE PROCEDURE add_request_path_column()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'staff_activity_log' 
        AND COLUMN_NAME = 'request_path'
    ) THEN
        ALTER TABLE staff_activity_log ADD COLUMN request_path VARCHAR(500) DEFAULT NULL AFTER request_method;
    END IF;
END//
CALL add_request_path_column()//
DROP PROCEDURE IF EXISTS add_request_path_column//

-- Modify staff_type to VARCHAR if it's an ENUM to support more flexibility
DROP PROCEDURE IF EXISTS fix_staff_type_column//
CREATE PROCEDURE fix_staff_type_column()
BEGIN
    DECLARE column_type VARCHAR(50);
    SELECT DATA_TYPE INTO column_type FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'staff_activity_log' 
    AND COLUMN_NAME = 'staff_type';
    
    IF column_type = 'enum' THEN
        ALTER TABLE staff_activity_log MODIFY COLUMN staff_type VARCHAR(50) NOT NULL;
    END IF;
END//
CALL fix_staff_type_column()//
DROP PROCEDURE IF EXISTS fix_staff_type_column//

-- Modify status to VARCHAR if it's an ENUM to support more flexibility
DROP PROCEDURE IF EXISTS fix_status_column//
CREATE PROCEDURE fix_status_column()
BEGIN
    DECLARE column_type VARCHAR(50);
    SELECT DATA_TYPE INTO column_type FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'staff_activity_log' 
    AND COLUMN_NAME = 'status';
    
    IF column_type = 'enum' THEN
        ALTER TABLE staff_activity_log MODIFY COLUMN status VARCHAR(20) DEFAULT 'success';
    END IF;
END//
CALL fix_status_column()//
DROP PROCEDURE IF EXISTS fix_status_column//

-- =====================================================
-- STEP 2: Update sp_insertStaffActivityLog to handle all columns properly
-- =====================================================

DROP PROCEDURE IF EXISTS sp_insertStaffActivityLog//
CREATE PROCEDURE sp_insertStaffActivityLog(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_action_type VARCHAR(100),
    IN p_action_description TEXT,
    IN p_module VARCHAR(100),
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT,
    IN p_request_method VARCHAR(10),
    IN p_request_path VARCHAR(500),
    IN p_status VARCHAR(20)
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, request_method, request_path, status, created_at)
    VALUES (p_staff_type, p_staff_id, p_staff_name, p_branch_id, p_action_type, p_action_description,
            p_module, p_ip_address, p_user_agent, p_request_method, p_request_path, 
            COALESCE(p_status, 'success'), NOW());
    
    SELECT LAST_INSERT_ID() as log_id;
END//

-- =====================================================
-- STEP 3: Create/Update login activity logging procedure
-- =====================================================

DROP PROCEDURE IF EXISTS sp_logStaffActivityLogin//
CREATE PROCEDURE sp_logStaffActivityLogin(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_action_description TEXT,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at) 
    VALUES (
        p_staff_type, p_staff_id, p_staff_name, p_branch_id, 'LOGIN', p_action_description, 
        'authentication', p_ip_address, p_user_agent, 'success', NOW()
    );
END//

-- =====================================================
-- STEP 4: Create/Update logout activity logging procedure
-- =====================================================

DROP PROCEDURE IF EXISTS sp_logStaffActivityLogout//
CREATE PROCEDURE sp_logStaffActivityLogout(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_action_description TEXT,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at) 
    VALUES (
        p_staff_type, p_staff_id, p_staff_name, p_branch_id, 'LOGOUT', p_action_description, 
        'authentication', p_ip_address, p_user_agent, 'success', NOW()
    );
END//

-- =====================================================
-- STEP 5: Create AUTO-LOGOUT activity logging procedure
-- For tracking when users are automatically logged out due to inactivity
-- =====================================================

DROP PROCEDURE IF EXISTS sp_logStaffActivityAutoLogout//
CREATE PROCEDURE sp_logStaffActivityAutoLogout(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at) 
    VALUES (
        p_staff_type, p_staff_id, p_staff_name, p_branch_id, 'AUTO_LOGOUT', 
        CONCAT(p_staff_name, ' was automatically logged out due to 5 minutes of inactivity'), 
        'authentication', p_ip_address, p_user_agent, 'success', NOW()
    );
END//

-- =====================================================
-- STEP 6: Create procedure to handle auto-logout for employees
-- Updates both last_logout and logs the activity
-- =====================================================

DROP PROCEDURE IF EXISTS sp_autoLogoutBusinessEmployee//
CREATE PROCEDURE sp_autoLogoutBusinessEmployee(
    IN p_employee_id INT,
    IN p_logout_time DATETIME,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_employee_name VARCHAR(255);
    DECLARE v_branch_id INT;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Get employee name and branch
    SELECT 
        CONCAT(first_name, ' ', last_name), 
        branch_id 
    INTO v_employee_name, v_branch_id
    FROM business_employee 
    WHERE business_employee_id = p_employee_id;
    
    -- Update last_logout
    UPDATE business_employee 
    SET last_logout = p_logout_time 
    WHERE business_employee_id = p_employee_id;
    
    -- Deactivate session
    UPDATE employee_session 
    SET is_active = 0, 
        logout_time = p_logout_time,
        last_activity = p_logout_time
    WHERE business_employee_id = p_employee_id 
      AND is_active = 1;
    
    -- Log the auto-logout activity
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at) 
    VALUES (
        'business_employee', p_employee_id, v_employee_name, v_branch_id, 'AUTO_LOGOUT', 
        CONCAT(v_employee_name, ' was automatically logged out due to 5 minutes of inactivity'), 
        'authentication', p_ip_address, p_user_agent, 'success', p_logout_time
    );
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 7: Create procedure to handle auto-logout for managers
-- =====================================================

DROP PROCEDURE IF EXISTS sp_autoLogoutBusinessManager//
CREATE PROCEDURE sp_autoLogoutBusinessManager(
    IN p_manager_id INT,
    IN p_logout_time DATETIME,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_manager_name VARCHAR(255);
    DECLARE v_branch_id INT;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Get manager name and branch
    SELECT 
        CONCAT(first_name, ' ', last_name), 
        branch_id 
    INTO v_manager_name, v_branch_id
    FROM business_manager 
    WHERE business_manager_id = p_manager_id;
    
    -- Update last_logout
    UPDATE business_manager 
    SET last_logout = p_logout_time 
    WHERE business_manager_id = p_manager_id;
    
    -- Log the auto-logout activity
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at) 
    VALUES (
        'business_manager', p_manager_id, v_manager_name, v_branch_id, 'AUTO_LOGOUT', 
        CONCAT(v_manager_name, ' was automatically logged out due to 5 minutes of inactivity'), 
        'authentication', p_ip_address, p_user_agent, 'success', p_logout_time
    );
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 8: Create procedure for auto-logout of inspectors (mobile)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_autoLogoutInspector//
CREATE PROCEDURE sp_autoLogoutInspector(
    IN p_inspector_id INT,
    IN p_logout_time DATETIME,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_inspector_name VARCHAR(255);
    DECLARE v_branch_id INT;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Get inspector name and branch
    SELECT 
        CONCAT(first_name, ' ', last_name), 
        branch_id 
    INTO v_inspector_name, v_branch_id
    FROM inspector 
    WHERE inspector_id = p_inspector_id;
    
    -- Update last_logout
    UPDATE inspector 
    SET last_logout = p_logout_time 
    WHERE inspector_id = p_inspector_id;
    
    -- Deactivate session
    UPDATE staff_session 
    SET is_active = 0, 
        logout_time = p_logout_time,
        last_activity = p_logout_time
    WHERE staff_id = p_inspector_id 
      AND staff_type = 'inspector'
      AND is_active = 1;
    
    -- Log the auto-logout activity
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at) 
    VALUES (
        'inspector', p_inspector_id, v_inspector_name, v_branch_id, 'AUTO_LOGOUT', 
        CONCAT(v_inspector_name, ' was automatically logged out due to 5 minutes of inactivity (mobile)'), 
        'mobile_app', p_ip_address, p_user_agent, 'success', p_logout_time
    );
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 9: Create procedure for auto-logout of collectors (mobile)
-- =====================================================

DROP PROCEDURE IF EXISTS sp_autoLogoutCollector//
CREATE PROCEDURE sp_autoLogoutCollector(
    IN p_collector_id INT,
    IN p_logout_time DATETIME,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_collector_name VARCHAR(255);
    DECLARE v_branch_id INT;
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Get collector name and branch
    SELECT 
        CONCAT(first_name, ' ', last_name), 
        branch_id 
    INTO v_collector_name, v_branch_id
    FROM collector 
    WHERE collector_id = p_collector_id;
    
    -- Update last_logout
    UPDATE collector 
    SET last_logout = p_logout_time 
    WHERE collector_id = p_collector_id;
    
    -- Deactivate session
    UPDATE staff_session 
    SET is_active = 0, 
        logout_time = p_logout_time,
        last_activity = p_logout_time
    WHERE staff_id = p_collector_id 
      AND staff_type = 'collector'
      AND is_active = 1;
    
    -- Log the auto-logout activity
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at) 
    VALUES (
        'collector', p_collector_id, v_collector_name, v_branch_id, 'AUTO_LOGOUT', 
        CONCAT(v_collector_name, ' was automatically logged out due to 5 minutes of inactivity (mobile)'), 
        'mobile_app', p_ip_address, p_user_agent, 'success', p_logout_time
    );
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

-- =====================================================
-- STEP 10: Add index for faster querying by action_type
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS add_activity_log_index//
CREATE PROCEDURE add_activity_log_index()
BEGIN
    DECLARE index_exists INT DEFAULT 0;
    
    -- Check if index exists
    SELECT COUNT(*) INTO index_exists
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'staff_activity_log'
    AND INDEX_NAME = 'idx_staff_activity_action';
    
    -- Create index if it doesn't exist
    IF index_exists = 0 THEN
        CREATE INDEX idx_staff_activity_action ON staff_activity_log(action_type, created_at);
    END IF;
END//

CALL add_activity_log_index()//
DROP PROCEDURE IF EXISTS add_activity_log_index//

DELIMITER ;

SELECT 'Migration 324 completed: Staff activity log table fixed and auto-logout procedures created' as status;
