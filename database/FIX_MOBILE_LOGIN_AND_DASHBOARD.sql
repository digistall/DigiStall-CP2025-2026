-- =====================================================
-- FIX MOBILE LOGIN AND DASHBOARD ISSUES
-- Run this script to fix all mobile login and active employee dashboard errors
-- Created: 2025-01-02
-- =====================================================

USE naga_stall;

-- =====================================================
-- STEP 1: Add missing columns to collector table
-- =====================================================

-- Add last_logout column to collector table if it doesn't exist
-- Using a procedure to handle the conditional ALTER safely
DROP PROCEDURE IF EXISTS add_collector_last_logout;
DELIMITER //
CREATE PROCEDURE add_collector_last_logout()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'collector' 
        AND COLUMN_NAME = 'last_logout'
    ) THEN
        ALTER TABLE collector ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL AFTER last_login;
        SELECT 'Added last_logout column to collector table' as result;
    ELSE
        SELECT 'Column last_logout already exists in collector table' as result;
    END IF;
END//
DELIMITER ;
CALL add_collector_last_logout();
DROP PROCEDURE IF EXISTS add_collector_last_logout;

-- =====================================================
-- STEP 2: Add missing columns to inspector table
-- =====================================================

-- Add last_logout column to inspector table if it doesn't exist
DROP PROCEDURE IF EXISTS add_inspector_last_logout;
DELIMITER //
CREATE PROCEDURE add_inspector_last_logout()
BEGIN
    IF NOT EXISTS (
        SELECT * FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'inspector' 
        AND COLUMN_NAME = 'last_logout'
    ) THEN
        ALTER TABLE inspector ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL AFTER last_login;
        SELECT 'Added last_logout column to inspector table' as result;
    ELSE
        SELECT 'Column last_logout already exists in inspector table' as result;
    END IF;
END//
DELIMITER ;
CALL add_inspector_last_logout();
DROP PROCEDURE IF EXISTS add_inspector_last_logout;

-- =====================================================
-- STEP 3: Ensure staff_session table exists with correct structure
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
-- STEP 4: Ensure employee_session table exists
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
-- STEP 5: Ensure staff_activity_log table exists
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
-- STEP 6: Fix collation for all relevant tables
-- =====================================================

-- Fix collector table collation
ALTER TABLE collector CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Fix inspector table collation
ALTER TABLE inspector CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Fix credential table collation
ALTER TABLE credential CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Fix applicant table collation
ALTER TABLE applicant CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Fix collector_assignment table collation
ALTER TABLE collector_assignment CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Fix inspector_assignment table collation
ALTER TABLE inspector_assignment CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- Fix branch table collation
ALTER TABLE branch CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;

-- =====================================================
-- STEP 7: Create/Update stored procedure for credential with applicant
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_getCredentialWithApplicant//

CREATE PROCEDURE sp_getCredentialWithApplicant(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.is_active,
        CONCAT(a.first_name, ' ', COALESCE(a.middle_name, ''), ' ', a.last_name) as applicant_full_name,
        a.first_name,
        a.middle_name,
        a.last_name,
        a.suffix,
        a.contact_no,
        a.gender,
        a.civil_status,
        a.birth_date,
        a.birth_place,
        a.present_address,
        a.permanent_address
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    WHERE c.user_name COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
      AND c.is_active = 1
    LIMIT 1;
END//

-- =====================================================
-- STEP 8: Create/Update stored procedure for staff activity logging
-- =====================================================

DROP PROCEDURE IF EXISTS sp_logStaffActivity//

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
    INSERT INTO staff_activity_log (
        staff_type, staff_id, staff_name, branch_id,
        action_type, action_description, module,
        ip_address, user_agent, status, created_at
    ) VALUES (
        p_staff_type, p_staff_id, p_staff_name, p_branch_id,
        p_action_type, p_action_description, p_module,
        p_ip_address, p_user_agent, p_status, 
        COALESCE(p_created_at, CURRENT_TIMESTAMP)
    );
END//

-- =====================================================
-- STEP 9: Create/Update stored procedure for inspector logout
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogout//

CREATE PROCEDURE sp_updateInspectorLastLogout(
    IN p_inspector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE inspector 
    SET last_logout = p_logout_time 
    WHERE inspector_id = p_inspector_id;
END//

-- =====================================================
-- STEP 10: Create/Update stored procedure for collector logout
-- =====================================================

DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogout//

CREATE PROCEDURE sp_updateCollectorLastLogout(
    IN p_collector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE collector 
    SET last_logout = p_logout_time 
    WHERE collector_id = p_collector_id;
END//

-- =====================================================
-- STEP 11: Create/Update stored procedures for password reset
-- =====================================================

DROP PROCEDURE IF EXISTS sp_resetInspectorPassword//

CREATE PROCEDURE sp_resetInspectorPassword(
    IN p_inspector_id INT,
    IN p_password_hash VARCHAR(255)
)
BEGIN
    UPDATE inspector 
    SET password_hash = p_password_hash,
        password = ''
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DROP PROCEDURE IF EXISTS sp_resetCollectorPassword//

CREATE PROCEDURE sp_resetCollectorPassword(
    IN p_collector_id INT,
    IN p_password_hash VARCHAR(255)
)
BEGIN
    UPDATE collector 
    SET password_hash = p_password_hash
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STEP 12: Update getCollectorsAll and getInspectorsAll to include all columns
-- =====================================================

DROP PROCEDURE IF EXISTS sp_getCollectorsAll//

CREATE PROCEDURE sp_getCollectorsAll()
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.date_created,
        c.last_login,
        c.last_logout,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    ORDER BY c.date_created DESC;
END//

DROP PROCEDURE IF EXISTS sp_getCollectorsByBranch//

CREATE PROCEDURE sp_getCollectorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.date_created,
        c.last_login,
        c.last_logout,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE ca.branch_id = p_branch_id
    ORDER BY c.date_created DESC;
END//

DROP PROCEDURE IF EXISTS sp_getInspectorsAll//

CREATE PROCEDURE sp_getInspectorsAll()
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        i.last_logout,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.status COLLATE utf8mb4_general_ci IN ('active', 'Active')
    ORDER BY i.date_hired DESC;
END//

DROP PROCEDURE IF EXISTS sp_getInspectorsByBranch//

CREATE PROCEDURE sp_getInspectorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        i.last_logout,
        COALESCE(ia.branch_id, p_branch_id) as branch_id,
        COALESCE(b.branch_name, 'Unassigned') as branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (ia.branch_id = p_branch_id OR ia.branch_id IS NULL)
      AND i.status COLLATE utf8mb4_general_ci IN ('active', 'Active')
    ORDER BY i.date_hired DESC;
END//

DELIMITER ;

-- =====================================================
-- STEP 13: Clear any stale sessions (optional - for testing)
-- =====================================================

-- Temporarily disable safe update mode
SET SQL_SAFE_UPDATES = 0;

-- Deactivate all staff sessions older than 24 hours
UPDATE staff_session 
SET is_active = 0 
WHERE session_id > 0
  AND is_active = 1 
  AND login_time < DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Deactivate all employee sessions older than 24 hours
UPDATE employee_session 
SET is_active = 0 
WHERE session_id > 0
  AND is_active = 1 
  AND login_time < DATE_SUB(NOW(), INTERVAL 24 HOUR);

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- =====================================================
-- STEP 14: Verify the fixes
-- =====================================================

-- Check collector table structure
SELECT 'Collector table columns:' as info;
SHOW COLUMNS FROM collector WHERE Field IN ('last_login', 'last_logout', 'status', 'password_hash');

-- Check inspector table structure
SELECT 'Inspector table columns:' as info;
SHOW COLUMNS FROM inspector WHERE Field IN ('last_login', 'last_logout', 'status', 'password', 'password_hash');

-- Check credential table structure
SELECT 'Credential table columns:' as info;
SHOW COLUMNS FROM credential;

-- Check staff_session table
SELECT 'Staff session table:' as info;
SHOW CREATE TABLE staff_session;

-- Check employee_session table
SELECT 'Employee session table:' as info;
SHOW CREATE TABLE employee_session;

-- Check active sessions
SELECT 'Active staff sessions:' as info;
SELECT staff_id, staff_type, is_active, login_time, last_activity FROM staff_session ORDER BY login_time DESC LIMIT 10;

SELECT '✅ All fixes applied successfully!' as status;
