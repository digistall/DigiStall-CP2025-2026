-- Migration: 027_createStallBusinessOwner.sql
-- Description: createStallBusinessOwner stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createStallBusinessOwner`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStallBusinessOwner` (IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_created_by_system_admin` INT)   BEGIN
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

DELIMITER ;
