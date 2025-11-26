-- Migration 025: System Administrator Stored Procedures
-- Purpose: CRUD operations for System Administrator
-- Date: 2025-11-26
-- Version: 1.0.0

DELIMITER $$

-- =====================================================================
-- CREATE SYSTEM ADMINISTRATOR
-- =====================================================================

DROP PROCEDURE IF EXISTS `createSystemAdministrator`$$
CREATE PROCEDURE `createSystemAdministrator`(
    IN `p_username` VARCHAR(50),
    IN `p_password_hash` VARCHAR(255),
    IN `p_first_name` VARCHAR(50),
    IN `p_last_name` VARCHAR(50),
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(100)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    INSERT INTO `system_administrator` (
        `username`, `password_hash`, `first_name`, `last_name`, 
        `contact_number`, `email`, `status`
    ) VALUES (
        p_username, p_password_hash, p_first_name, p_last_name,
        p_contact_number, p_email, 'Active'
    );
    
    COMMIT;
    
    SELECT 1 as success, 
           'System Administrator created successfully' AS message,
           LAST_INSERT_ID() as system_admin_id;
END$$

-- =====================================================================
-- GET SYSTEM ADMINISTRATOR BY ID
-- =====================================================================

DROP PROCEDURE IF EXISTS `getSystemAdministratorById`$$
CREATE PROCEDURE `getSystemAdministratorById`(
    IN `p_system_admin_id` INT
)
BEGIN
    SELECT * FROM `system_administrator` 
    WHERE `system_admin_id` = p_system_admin_id;
END$$

-- =====================================================================
-- GET SYSTEM ADMINISTRATOR BY USERNAME
-- =====================================================================

DROP PROCEDURE IF EXISTS `getSystemAdministratorByUsername`$$
CREATE PROCEDURE `getSystemAdministratorByUsername`(
    IN `p_username` VARCHAR(50)
)
BEGIN
    SELECT * FROM `system_administrator` 
    WHERE `username` = p_username 
    AND `status` = 'Active';
END$$

-- =====================================================================
-- GET ALL SYSTEM ADMINISTRATORS
-- =====================================================================

DROP PROCEDURE IF EXISTS `getAllSystemAdministrators`$$
CREATE PROCEDURE `getAllSystemAdministrators`()
BEGIN
    SELECT 
        `system_admin_id`,
        `username`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        `created_at`,
        `updated_at`
    FROM `system_administrator`
    ORDER BY `created_at` DESC;
END$$

-- =====================================================================
-- UPDATE SYSTEM ADMINISTRATOR
-- =====================================================================

DROP PROCEDURE IF EXISTS `updateSystemAdministrator`$$
CREATE PROCEDURE `updateSystemAdministrator`(
    IN `p_system_admin_id` INT,
    IN `p_first_name` VARCHAR(50),
    IN `p_last_name` VARCHAR(50),
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(100),
    IN `p_status` ENUM('Active', 'Inactive')
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    UPDATE `system_administrator`
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `contact_number` = COALESCE(p_contact_number, `contact_number`),
        `email` = COALESCE(p_email, `email`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `system_admin_id` = p_system_admin_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'System Administrator updated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

-- =====================================================================
-- DELETE/DEACTIVATE SYSTEM ADMINISTRATOR
-- =====================================================================

DROP PROCEDURE IF EXISTS `deleteSystemAdministrator`$$
CREATE PROCEDURE `deleteSystemAdministrator`(
    IN `p_system_admin_id` INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Soft delete by setting status to Inactive
    UPDATE `system_administrator`
    SET `status` = 'Inactive', `updated_at` = NOW()
    WHERE `system_admin_id` = p_system_admin_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'System Administrator deactivated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

-- =====================================================================
-- LOGIN SYSTEM ADMINISTRATOR
-- =====================================================================

DROP PROCEDURE IF EXISTS `loginSystemAdministrator`$$
CREATE PROCEDURE `loginSystemAdministrator`(
    IN `p_username` VARCHAR(50)
)
BEGIN
    SELECT 
        `system_admin_id`,
        `username`,
        `password_hash`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        'system_administrator' as role
    FROM `system_administrator`
    WHERE `username` = p_username 
    AND `status` = 'Active'
    LIMIT 1;
END$$

-- =====================================================================
-- RESET PASSWORD FOR SYSTEM ADMINISTRATOR
-- =====================================================================

DROP PROCEDURE IF EXISTS `resetSystemAdministratorPassword`$$
CREATE PROCEDURE `resetSystemAdministratorPassword`(
    IN `p_system_admin_id` INT,
    IN `p_new_password_hash` VARCHAR(255)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    UPDATE `system_administrator`
    SET 
        `password_hash` = p_new_password_hash,
        `updated_at` = NOW()
    WHERE `system_admin_id` = p_system_admin_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Password reset successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

-- =====================================================================
-- RECORD MIGRATION
-- =====================================================================

INSERT INTO `migrations` (`migration_name`, `version`, `executed_at`)
VALUES ('025_system_administrator_procedures', '1.0.0', NOW());

SELECT '✅ Migration 025: System Administrator Procedures created successfully!' AS status;
