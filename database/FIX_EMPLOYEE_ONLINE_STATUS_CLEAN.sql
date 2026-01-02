-- =====================================================
-- CLEAN VERSION - Employee Online Status Fix
-- Run after SET_TIMEZONE.sql
-- =====================================================

USE naga_stall;

-- First, drop any existing problematic procedures
DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll;
DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches;
DROP PROCEDURE IF EXISTS sp_createOrUpdateEmployeeSession;
DROP PROCEDURE IF EXISTS sp_endEmployeeSession;
DROP PROCEDURE IF EXISTS sp_createOrUpdateStaffSession;
DROP PROCEDURE IF EXISTS sp_endStaffSession;
DROP PROCEDURE IF EXISTS sp_updateEmployeeSessionActivity;

-- Drop old table if exists and recreate
DROP TABLE IF EXISTS staff_session;

-- Create staff_session table
CREATE TABLE `staff_session` (
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

DELIMITER //

-- Employee session procedures
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

CREATE PROCEDURE sp_updateEmployeeSessionActivity(
    IN p_employee_id INT
)
BEGIN
    UPDATE employee_session 
    SET last_activity = CURRENT_TIMESTAMP
    WHERE business_employee_id = p_employee_id AND is_active = 1;
END//

-- Staff session procedures
-- Note: inspector table uses inspector_id (not staff_id)
-- Note: collector table uses collector_id
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
    
    -- inspector uses inspector_id, collector uses collector_id
    IF p_staff_type = 'inspector' THEN
        UPDATE inspector SET status = 'active' WHERE inspector_id = p_staff_id;
    ELSE
        UPDATE collector SET status = 'active' WHERE collector_id = p_staff_id;
    END IF;
    
    SELECT 'success' as status, p_staff_id as staff_id, p_staff_type as staff_type;
END//

CREATE PROCEDURE sp_endStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(20)
)
BEGIN
    UPDATE staff_session 
    SET is_active = 0, 
        logout_time = CURRENT_TIMESTAMP
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    -- inspector uses inspector_id, collector uses collector_id
    IF p_staff_type = 'inspector' THEN
        UPDATE inspector SET status = 'inactive' WHERE inspector_id = p_staff_id;
    ELSE
        UPDATE collector SET status = 'inactive' WHERE collector_id = p_staff_id;
    END IF;
    
    SELECT ROW_COUNT() as sessions_ended;
END//

-- Get active sessions (all users - system admin view)
-- Note: inspector branch is in inspector_assignment, collector branch is in collector_assignment
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

-- Get active sessions by branches
-- Note: inspector branch is in inspector_assignment, collector branch is in collector_assignment
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

-- Verify
SELECT 'Employee Online Status Fix - Clean Version Created Successfully!' as status;

SELECT ROUTINE_NAME, ROUTINE_TYPE 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME LIKE '%Session%'
ORDER BY ROUTINE_NAME;
