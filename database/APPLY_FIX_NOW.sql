-- =====================================================
-- APPLY FIX NOW - Run this script to fix login and dashboard errors
-- This script combines all necessary fixes
-- =====================================================

USE naga_stall;

-- =====================================================
-- STEP 1: Ensure employee_session table exists
-- =====================================================

CREATE TABLE IF NOT EXISTS `employee_session` (
  `session_id` INT(11) NOT NULL AUTO_INCREMENT,
  `business_employee_id` INT(11) NOT NULL,
  `session_token` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `login_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1,
  `logout_time` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_employee_session_employee` (`business_employee_id`),
  KEY `idx_employee_session_active` (`is_active`),
  KEY `idx_last_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 2: Ensure staff_session table exists
-- =====================================================

CREATE TABLE IF NOT EXISTS `staff_session` (
  `session_id` INT(11) NOT NULL AUTO_INCREMENT,
  `staff_id` INT(11) NOT NULL,
  `staff_type` ENUM('inspector', 'collector') NOT NULL,
  `session_token` VARCHAR(255) DEFAULT NULL,
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `login_time` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_activity` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `is_active` TINYINT(1) DEFAULT 1,
  `logout_time` TIMESTAMP NULL DEFAULT NULL,
  PRIMARY KEY (`session_id`),
  KEY `idx_staff_active` (`staff_id`, `staff_type`, `is_active`),
  KEY `idx_last_activity` (`last_activity`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 3: Ensure staff_activity_log table exists
-- =====================================================

CREATE TABLE IF NOT EXISTS `staff_activity_log` (
  `log_id` INT(11) NOT NULL AUTO_INCREMENT,
  `staff_type` VARCHAR(50) NOT NULL,
  `staff_id` INT(11) NOT NULL,
  `staff_name` VARCHAR(255) DEFAULT NULL,
  `branch_id` INT(11) DEFAULT NULL,
  `action_type` VARCHAR(50) NOT NULL,
  `action_description` TEXT DEFAULT NULL,
  `module` VARCHAR(100) DEFAULT 'mobile_app',
  `ip_address` VARCHAR(45) DEFAULT NULL,
  `user_agent` TEXT DEFAULT NULL,
  `status` VARCHAR(50) DEFAULT 'success',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`log_id`),
  KEY `idx_staff_activity` (`staff_type`, `staff_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 4: Drop and recreate all stored procedures
-- =====================================================

DELIMITER //

-- Drop existing procedures to ensure clean state
DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll//
DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches//
DROP PROCEDURE IF EXISTS sp_createOrUpdateEmployeeSession//
DROP PROCEDURE IF EXISTS sp_endEmployeeSession//
DROP PROCEDURE IF EXISTS sp_createOrUpdateStaffSession//
DROP PROCEDURE IF EXISTS sp_endStaffSession//
DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity//
DROP PROCEDURE IF EXISTS sp_getInspectorByUsername//
DROP PROCEDURE IF EXISTS sp_getCollectorByUsername//
DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogin//
DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogin//
DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogout//
DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogout//
DROP PROCEDURE IF EXISTS sp_getInspectorNameById//
DROP PROCEDURE IF EXISTS sp_getCollectorNameById//
DROP PROCEDURE IF EXISTS sp_logStaffActivity//

-- =====================================================
-- SP: sp_getInspectorByUsername
-- =====================================================
CREATE PROCEDURE sp_getInspectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        i.inspector_id,
        i.inspector_id as staff_id,
        i.username,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.status,
        i.password as password_hash,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (i.username = p_username OR i.email = p_username)
      AND i.status = 'active'
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getCollectorByUsername
-- =====================================================
CREATE PROCEDURE sp_getCollectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        c.collector_id,
        c.collector_id as staff_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.status,
        c.password_hash,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (c.username = p_username OR c.email = p_username)
      AND c.status = 'active'
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_updateInspectorLastLogin
-- =====================================================
CREATE PROCEDURE sp_updateInspectorLastLogin(
    IN p_inspector_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE inspector 
    SET last_login = p_login_time 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_updateCollectorLastLogin
-- =====================================================
CREATE PROCEDURE sp_updateCollectorLastLogin(
    IN p_collector_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE collector 
    SET last_login = p_login_time 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_updateInspectorLastLogout
-- =====================================================
CREATE PROCEDURE sp_updateInspectorLastLogout(
    IN p_inspector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE inspector 
    SET last_logout = p_logout_time 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_updateCollectorLastLogout
-- =====================================================
CREATE PROCEDURE sp_updateCollectorLastLogout(
    IN p_collector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE collector 
    SET last_logout = p_logout_time 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_getInspectorNameById
-- =====================================================
CREATE PROCEDURE sp_getInspectorNameById(
    IN p_inspector_id INT
)
BEGIN
    SELECT first_name, last_name 
    FROM inspector 
    WHERE inspector_id = p_inspector_id;
END//

-- =====================================================
-- SP: sp_getCollectorNameById
-- =====================================================
CREATE PROCEDURE sp_getCollectorNameById(
    IN p_collector_id INT
)
BEGIN
    SELECT first_name, last_name 
    FROM collector 
    WHERE collector_id = p_collector_id;
END//

-- =====================================================
-- SP: sp_logStaffActivity
-- =====================================================
CREATE PROCEDURE sp_logStaffActivity(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_action_type VARCHAR(50),
    IN p_action_description TEXT,
    IN p_module VARCHAR(100),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_status VARCHAR(50),
    IN p_created_at DATETIME
)
BEGIN
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at)
    VALUES (
        p_staff_type,
        p_staff_id,
        p_staff_name,
        p_branch_id,
        p_action_type,
        p_action_description,
        p_module,
        p_ip_address,
        p_user_agent,
        p_status,
        IFNULL(p_created_at, NOW())
    );
    
    SELECT LAST_INSERT_ID() as log_id;
END//

-- =====================================================
-- SP: sp_createOrUpdateEmployeeSession
-- =====================================================
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
            is_active = 1,
            logout_time = NULL
        WHERE business_employee_id = p_employee_id AND is_active = 1;
    ELSE
        INSERT INTO employee_session 
            (business_employee_id, session_token, ip_address, user_agent, is_active)
        VALUES 
            (p_employee_id, p_session_token, p_ip_address, p_user_agent, 1);
    END IF;
    
    UPDATE business_employee SET is_active = 1 WHERE business_employee_id = p_employee_id;
    
    SELECT 'success' as status, p_employee_id as employee_id;
END//

-- =====================================================
-- SP: sp_endEmployeeSession
-- =====================================================
CREATE PROCEDURE sp_endEmployeeSession(
    IN p_employee_id INT
)
BEGIN
    UPDATE employee_session 
    SET is_active = 0, 
        logout_time = CURRENT_TIMESTAMP
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    UPDATE business_employee SET is_active = 0 WHERE business_employee_id = p_employee_id;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- =====================================================
-- SP: sp_updateEmployeeSessionActivity
-- =====================================================
CREATE PROCEDURE sp_updateEmployeeSessionActivity(
    IN p_employee_id INT
)
BEGIN
    UPDATE employee_session 
    SET last_activity = CURRENT_TIMESTAMP
    WHERE business_employee_id = p_employee_id AND is_active = 1;
END//

-- =====================================================
-- SP: sp_createOrUpdateStaffSession
-- =====================================================
CREATE PROCEDURE sp_createOrUpdateStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(20),
    IN p_session_token VARCHAR(255),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE v_existing_session INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_existing_session 
    FROM staff_session 
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    IF v_existing_session > 0 THEN
        UPDATE staff_session 
        SET session_token = p_session_token,
            ip_address = p_ip_address,
            user_agent = p_user_agent,
            is_active = 1,
            logout_time = NULL
        WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    ELSE
        INSERT INTO staff_session 
            (staff_id, staff_type, session_token, ip_address, user_agent, is_active)
        VALUES 
            (p_staff_id, p_staff_type, p_session_token, p_ip_address, p_user_agent, 1);
    END IF;
    
    IF p_staff_type = 'inspector' THEN
        UPDATE inspector SET status = 'active' WHERE inspector_id = p_staff_id;
    ELSE
        UPDATE collector SET status = 'active' WHERE collector_id = p_staff_id;
    END IF;
    
    SELECT 'success' as status, p_staff_id as staff_id, p_staff_type as staff_type;
END//

-- =====================================================
-- SP: sp_endStaffSession
-- =====================================================
CREATE PROCEDURE sp_endStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(20)
)
BEGIN
    UPDATE staff_session 
    SET is_active = 0, 
        logout_time = CURRENT_TIMESTAMP
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    IF p_staff_type = 'inspector' THEN
        UPDATE inspector SET status = 'inactive' WHERE inspector_id = p_staff_id;
    ELSE
        UPDATE collector SET status = 'inactive' WHERE collector_id = p_staff_id;
    END IF;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- =====================================================
-- SP: sp_getActiveSessionsAll
-- =====================================================
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
END//

-- =====================================================
-- SP: sp_getActiveSessionsByBranches
-- =====================================================
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
                WHEN ss.staff_type = ''inspector'' THEN ia.branch_id
                ELSE ca.branch_id
            END as branch_id,
            CASE 
                WHEN ss.staff_type = ''inspector'' THEN i.email
                ELSE c.email
            END as email,
            b.branch_name
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
END//

DELIMITER ;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT '✅ ALL FIXES APPLIED SUCCESSFULLY!' as status;

SELECT ROUTINE_NAME, ROUTINE_TYPE 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME IN (
    'sp_getActiveSessionsAll',
    'sp_getActiveSessionsByBranches',
    'sp_createOrUpdateEmployeeSession',
    'sp_endEmployeeSession',
    'sp_createOrUpdateStaffSession',
    'sp_endStaffSession',
    'sp_getInspectorByUsername',
    'sp_getCollectorByUsername',
    'sp_logStaffActivity'
)
ORDER BY ROUTINE_NAME;
