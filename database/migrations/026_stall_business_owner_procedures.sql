-- Migration 026: Stall Business Owner Stored Procedures (Updated from Admin)
-- Purpose: CRUD operations for Stall Business Owner
-- Date: 2025-11-26
-- Version: 1.0.0

DELIMITER $$

-- =====================================================================
-- CREATE STALL BUSINESS OWNER
-- =====================================================================

DROP PROCEDURE IF EXISTS `createStallBusinessOwner`$$
CREATE PROCEDURE `createStallBusinessOwner`(
    IN `p_username` VARCHAR(50),
    IN `p_password_hash` VARCHAR(255),
    IN `p_first_name` VARCHAR(50),
    IN `p_last_name` VARCHAR(50),
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(100),
    IN `p_created_by_system_admin` INT
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
    
    INSERT INTO `stall_business_owner` (
        `owner_username`, `owner_password_hash`, `first_name`, `last_name`,
        `contact_number`, `email`, `status`, `created_by_system_admin`
    ) VALUES (
        p_username, p_password_hash, p_first_name, p_last_name,
        p_contact_number, p_email, 'Active', p_created_by_system_admin
    );
    
    COMMIT;
    
    SELECT 1 as success, 
           'Business Owner created successfully' AS message,
           LAST_INSERT_ID() as business_owner_id;
END$$

-- =====================================================================
-- GET STALL BUSINESS OWNER BY ID
-- =====================================================================

DROP PROCEDURE IF EXISTS `getStallBusinessOwnerById`$$
CREATE PROCEDURE `getStallBusinessOwnerById`(
    IN `p_business_owner_id` INT
)
BEGIN
    SELECT * FROM `stall_business_owner` 
    WHERE `business_owner_id` = p_business_owner_id;
END$$

-- =====================================================================
-- GET STALL BUSINESS OWNER BY USERNAME
-- =====================================================================

DROP PROCEDURE IF EXISTS `getStallBusinessOwnerByUsername`$$
CREATE PROCEDURE `getStallBusinessOwnerByUsername`(
    IN `p_username` VARCHAR(50)
)
BEGIN
    SELECT * FROM `stall_business_owner` 
    WHERE `owner_username` = p_username;
END$$

-- =====================================================================
-- GET STALL BUSINESS OWNER BY USERNAME FOR LOGIN
-- =====================================================================

DROP PROCEDURE IF EXISTS `getStallBusinessOwnerByUsernameLogin`$$
CREATE PROCEDURE `getStallBusinessOwnerByUsernameLogin`(
    IN `p_username` VARCHAR(50)
)
BEGIN
    SELECT 
        `business_owner_id`,
        `owner_username`,
        `owner_password_hash`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        'stall_business_owner' as role
    FROM `stall_business_owner` 
    WHERE `owner_username` = p_username 
    AND `status` = 'Active';
END$$

-- =====================================================================
-- GET ALL STALL BUSINESS OWNERS
-- =====================================================================

DROP PROCEDURE IF EXISTS `getAllStallBusinessOwners`$$
CREATE PROCEDURE `getAllStallBusinessOwners`()
BEGIN
    SELECT 
        sbo.`business_owner_id`,
        sbo.`owner_username`,
        sbo.`first_name`,
        sbo.`last_name`,
        sbo.`contact_number`,
        sbo.`email`,
        sbo.`status`,
        sbo.`created_at`,
        sbo.`updated_at`,
        CONCAT(sa.`first_name`, ' ', sa.`last_name`) as created_by_name
    FROM `stall_business_owner` sbo
    LEFT JOIN `system_administrator` sa ON sbo.`created_by_system_admin` = sa.`system_admin_id`
    ORDER BY sbo.`created_at` DESC;
END$$

-- =====================================================================
-- UPDATE STALL BUSINESS OWNER
-- =====================================================================

DROP PROCEDURE IF EXISTS `updateStallBusinessOwner`$$
CREATE PROCEDURE `updateStallBusinessOwner`(
    IN `p_business_owner_id` INT,
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
    
    UPDATE `stall_business_owner`
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `contact_number` = COALESCE(p_contact_number, `contact_number`),
        `email` = COALESCE(p_email, `email`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_owner_id` = p_business_owner_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Business Owner updated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

-- =====================================================================
-- DELETE/DEACTIVATE STALL BUSINESS OWNER
-- =====================================================================

DROP PROCEDURE IF EXISTS `deleteStallBusinessOwner`$$
CREATE PROCEDURE `deleteStallBusinessOwner`(
    IN `p_business_owner_id` INT
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
    UPDATE `stall_business_owner`
    SET `status` = 'Inactive', `updated_at` = NOW()
    WHERE `business_owner_id` = p_business_owner_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Business Owner deactivated successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

-- =====================================================================
-- RESET PASSWORD FOR STALL BUSINESS OWNER
-- =====================================================================

DROP PROCEDURE IF EXISTS `resetStallBusinessOwnerPassword`$$
CREATE PROCEDURE `resetStallBusinessOwnerPassword`(
    IN `p_business_owner_id` INT,
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
    
    UPDATE `stall_business_owner`
    SET 
        `owner_password_hash` = p_new_password_hash,
        `updated_at` = NOW()
    WHERE `business_owner_id` = p_business_owner_id;
    
    COMMIT;
    
    SELECT 1 as success, 
           'Password reset successfully' AS message,
           ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

-- =====================================================================
-- DROP OLD ADMIN PROCEDURES
-- =====================================================================

DROP PROCEDURE IF EXISTS `createAdmin`;
DROP PROCEDURE IF EXISTS `getAdminById`;
DROP PROCEDURE IF EXISTS `getAdminByUsername`;
DROP PROCEDURE IF EXISTS `getAdminByUsernameLogin`;

-- =====================================================================
-- RECORD MIGRATION
-- =====================================================================

INSERT INTO `migrations` (`migration_name`, `version`, `executed_at`)
VALUES ('026_stall_business_owner_procedures', '1.0.0', NOW());

SELECT '✅ Migration 026: Stall Business Owner Procedures created successfully!' AS status;
