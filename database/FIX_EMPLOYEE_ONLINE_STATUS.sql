-- =====================================================
-- FIX: Employee Online Status and Session Management
-- Run this in MySQL Workbench to fix employee online tracking
-- INCLUDES: Timezone fix (Philippine Time) + Inspector/Collector tracking
-- =====================================================

USE naga_stall;

-- =====================================================
-- STEP 1: Create staff_session table for Inspector/Collector
-- =====================================================
CREATE TABLE IF NOT EXISTS `staff_session` (
  `session_id` INT(11) NOT NULL AUTO_INCREMENT,
  `staff_id` INT(11) NOT NULL,
  `staff_type` ENUM('inspector', 'collector') NOT NULL,
  `session_token` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `login_time` DATETIME NOT NULL,
  `last_activity` DATETIME NOT NULL,
  `is_active` TINYINT(1) DEFAULT 1,
  `logout_time` DATETIME DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_staff_active` (`staff_id`, `staff_type`, `is_active`),
  KEY `idx_last_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

DELIMITER //

-- =====================================================
-- HELPER FUNCTION: Get Philippine Time
-- =====================================================
DROP FUNCTION IF EXISTS fn_getPhilippineTime//
CREATE FUNCTION fn_getPhilippineTime()
RETURNS DATETIME
DETERMINISTIC
BEGIN
    RETURN CONVERT_TZ(NOW(), @@session.time_zone, '+08:00');
END//

-- =====================================================
-- SP: sp_createOrUpdateEmployeeSession
-- Purpose: Create or update employee session on login (WITH TIMEZONE FIX)
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
        -- Update existing session (timestamp auto-updates)
        UPDATE employee_session 
        SET session_token = p_session_token,
            ip_address = p_ip_address,
            user_agent = p_user_agent,
            last_activity = CURRENT_TIMESTAMP,
            is_active = 1,
            logout_time = NULL
        WHERE business_employee_id = p_employee_id AND is_active = 1;
    ELSE
        -- Create new session (timestamp auto-sets to current time)
        INSERT INTO employee_session 
            (business_employee_id, session_token, ip_address, user_agent, is_active)
        VALUES 
            (p_employee_id, p_session_token, p_ip_address, p_user_agent, 1);
    END IF;
    
    -- Also update the business_employee table is_active flag
    UPDATE business_employee SET is_active = 1 WHERE business_employee_id = p_employee_id;
    
    SELECT 'success' as status, p_employee_id as employee_id;
END//

-- =====================================================
-- SP: sp_endEmployeeSession
-- Purpose: End employee session on logout (WITH TIMEZONE FIX)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_endEmployeeSession//
CREATE PROCEDURE sp_endEmployeeSession(
    IN p_employee_id INT
)
BEGIN
    -- End all active sessions for this employee
    UPDATE employee_session 
    SET is_active = 0, 
        logout_time = CURRENT_TIMESTAMP
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    -- Also update the business_employee table is_active flag
    UPDATE business_employee SET is_active = 0 WHERE business_employee_id = p_employee_id;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- =====================================================
-- SP: sp_updateEmployeeSessionActivity
-- Purpose: Update last_activity timestamp (heartbeat) WITH TIMEZONE FIX
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity//
CREATE PROCEDURE sp_updateEmployeeSessionActivity(
    IN p_employee_id INT
)
BEGIN
    UPDATE employee_session 
    SET last_activity = CURRENT_TIMESTAMP
    WHERE business_employee_id = p_employee_id AND is_active = 1;
END//

-- =====================================================
-- SP: sp_createOrUpdateStaffSession (NEW - For Inspector/Collector)
-- Purpose: Create or update staff session on mobile login
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
    DECLARE v_philippine_time DATETIME;
    
    SET v_philippine_time = CONVERT_TZ(NOW(), @@session.time_zone, '+08:00');
    
    -- Check if active session exists
    SELECT COUNT(*) INTO v_existing_session 
    FROM staff_session 
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    IF v_existing_session > 0 THEN
        -- Update existing session
        UPDATE staff_session 
        SET session_token = p_session_token,
            ip_address = p_ip_address,
            user_agent = p_user_agent,
            last_activity = v_philippine_time,
            is_active = 1,
            logout_time = NULL
        WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    ELSE
        -- Create new session
        INSERT INTO staff_session 
            (staff_id, staff_type, session_token, ip_address, user_agent, login_time, last_activity, is_active)
        VALUES 
            (p_staff_id, p_staff_type, p_session_token, p_ip_address, p_user_agent, v_philippine_time, v_philippine_time, 1);
    END IF;
    
    -- Update is_active on inspector/collector table
    IF p_staff_type = 'inspector' THEN
        UPDATE inspector SET is_active = 1 WHERE staff_id = p_staff_id;
    ELSE
        UPDATE collector SET is_active = 1 WHERE collector_id = p_staff_id;
    END IF;
    
    SELECT 'success' as status, p_staff_id as staff_id, p_staff_type as staff_type;
END//

-- =====================================================
-- SP: sp_endStaffSession (NEW - For Inspector/Collector logout)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_endStaffSession//
CREATE PROCEDURE sp_endStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(20)
)
BEGIN
    DECLARE v_philippine_time DATETIME;
    SET v_philippine_time = CONVERT_TZ(NOW(), @@session.time_zone, '+08:00');
    
    UPDATE staff_session 
    SET is_active = 0, logout_time = v_philippine_time
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    -- Update is_active on inspector/collector table
    IF p_staff_type = 'inspector' THEN
        UPDATE inspector SET is_active = 0 WHERE staff_id = p_staff_id;
    ELSE
        UPDATE collector SET is_active = 0 WHERE collector_id = p_staff_id;
    END IF;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- =====================================================
-- SP: sp_getActiveSessionsAll (for system admin)
-- Purpose: Get all active employee AND staff sessions (WITH TIMEZONE FIX)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll//
CREATE PROCEDURE sp_getActiveSessionsAll()
BEGIN
    -- Get both employee and staff sessions
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
            WHEN ss.staff_type = 'inspector' THEN i.branch_id
            ELSE c.branch_id
        END as branch_id,
        CASE 
            WHEN ss.staff_type = 'inspector' THEN i.email
            ELSE c.email
        END as email,
        b.branch_name
    FROM staff_session ss
    LEFT JOIN inspector i ON ss.staff_id = i.staff_id AND ss.staff_type = 'inspector'
    LEFT JOIN collector c ON ss.staff_id = c.collector_id AND ss.staff_type = 'collector'
    LEFT JOIN branch b ON (i.branch_id = b.branch_id OR c.branch_id = b.branch_id)
    WHERE ss.is_active = 1 
       OR ss.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    
    ORDER BY last_activity DESC;
END//

-- =====================================================
-- SP: sp_getActiveSessionsByBranches (for branch filtering)
-- Purpose: Get active sessions filtered by multiple branches (WITH TIMEZONE FIX)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches//
CREATE PROCEDURE sp_getActiveSessionsByBranches(
    IN p_branch_ids VARCHAR(500)
)
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
            ss.staff_type as user_type,
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
                WHEN ss.staff_type = ''inspector'' THEN i.branch_id
                ELSE c.branch_id
            END as branch_id,
            CASE 
                WHEN ss.staff_type = ''inspector'' THEN i.email
                ELSE c.email
            END as email,
            b.branch_name
        FROM staff_session ss
        LEFT JOIN inspector i ON ss.staff_id = i.staff_id AND ss.staff_type = ''inspector''
        LEFT JOIN collector c ON ss.staff_id = c.collector_id AND ss.staff_type = ''collector''
        LEFT JOIN branch b ON (i.branch_id = b.branch_id OR c.branch_id = b.branch_id)
        WHERE (i.branch_id IN (', p_branch_ids, ') OR c.branch_id IN (', p_branch_ids, '))
        AND (ss.is_active = 1 OR ss.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
        
        ORDER BY last_activity DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

DELIMITER ;

-- =====================================================
-- NOTE: Do NOT run this UPDATE multiple times!
-- Only run ONCE if your existing data has wrong timezone
-- Comment out after first run to prevent adding 8 hours repeatedly
-- =====================================================
-- UPDATE employee_session 
-- SET login_time = DATE_ADD(login_time, INTERVAL 8 HOUR),
--     last_activity = DATE_ADD(last_activity, INTERVAL 8 HOUR),
--     logout_time = CASE WHEN logout_time IS NOT NULL THEN DATE_ADD(logout_time, INTERVAL 8 HOUR) ELSE NULL END
-- WHERE login_time < NOW();

-- =====================================================
-- Verify the stored procedures were created
-- =====================================================
SELECT 'Employee Online Status Fix - Stored Procedures Created Successfully!' as status;

-- Show all session-related stored procedures
SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND (ROUTINE_NAME LIKE '%Session%' OR ROUTINE_NAME LIKE '%Staff%')
ORDER BY ROUTINE_NAME;
