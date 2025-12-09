-- Migration: 252_updateInspectorProcedures.sql
-- Description: Enhanced stored procedures for inspector account management with username/password
-- Date: 2025-12-09

-- ========================================
-- ADD USERNAME COLUMN TO INSPECTOR TABLE (IF NOT EXISTS)
-- ========================================

-- Check and add username column if it doesn't exist
SET @column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inspector' 
    AND COLUMN_NAME = 'username'
);

SET @sql = IF(@column_exists = 0, 
    'ALTER TABLE inspector ADD COLUMN username VARCHAR(50) UNIQUE AFTER inspector_id',
    'SELECT "username column already exists"');

PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add password_hash column if using old password format
SET @hash_column_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inspector' 
    AND COLUMN_NAME = 'password_hash'
);

SET @sql2 = IF(@hash_column_exists = 0, 
    'ALTER TABLE inspector ADD COLUMN password_hash VARCHAR(255) AFTER password',
    'SELECT "password_hash column already exists"');

PREPARE stmt2 FROM @sql2;
EXECUTE stmt2;
DEALLOCATE PREPARE stmt2;

-- ========================================
-- NOW SWITCH DELIMITER FOR STORED PROCEDURES
-- ========================================

DELIMITER $$

-- ========================================
-- CREATE INSPECTOR WITH USERNAME PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `createInspectorWithCredentials`$$

CREATE PROCEDURE `createInspectorWithCredentials` (
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20),
    IN p_branch_id INT,
    IN p_date_hired DATE,
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE new_inspector_id INT;
    DECLARE exit_handler BOOLEAN DEFAULT FALSE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET exit_handler = TRUE;
    
    -- Insert inspector with username and hashed password
    INSERT INTO inspector (
        username,
        first_name,
        last_name,
        middle_name,
        email,
        password,
        password_hash,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_username,
        p_first_name,
        p_last_name,
        '',
        p_email,
        '',
        p_password_hash,
        p_contact_no,
        IFNULL(p_date_hired, CURDATE()),
        'active'
    );
    
    IF exit_handler THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to create inspector';
    END IF;
    
    SET new_inspector_id = LAST_INSERT_ID();
    
    -- Create branch assignment
    INSERT INTO inspector_assignment (
        inspector_id,
        branch_id,
        start_date,
        status,
        remarks
    ) VALUES (
        new_inspector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        'Newly hired inspector'
    );
    
    -- Log the action
    INSERT INTO inspector_action_log (
        inspector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        new_inspector_id,
        p_branch_id,
        p_branch_manager_id,
        'New Hire',
        NOW(),
        CONCAT('Inspector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id)
    );
    
    -- Return the new inspector
    SELECT 
        new_inspector_id as inspector_id,
        p_username as username,
        p_first_name as first_name,
        p_last_name as last_name,
        p_email as email,
        'Inspector created successfully' as message;
END$$

-- ========================================
-- GET INSPECTOR BY USERNAME PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `getInspectorByUsername`$$

CREATE PROCEDURE `getInspectorByUsername` (
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.password_hash,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.date_created,
        i.date_hired,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.username = p_username AND i.status = 'active'
    LIMIT 1;
END$$

-- ========================================
-- GET ALL INSPECTORS BY BRANCH PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `getInspectorsByBranch`$$

CREATE PROCEDURE `getInspectorsByBranch` (
    IN p_branch_id INT
)
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.date_created,
        i.date_hired,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE ia.branch_id = p_branch_id
    ORDER BY i.date_created DESC;
END$$

DELIMITER ;
