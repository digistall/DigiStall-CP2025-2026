-- Migration: 029_createSystemAdministrator.sql
-- Description: createSystemAdministrator stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createSystemAdministrator`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createSystemAdministrator` (IN `p_username` VARCHAR(50), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100))   BEGIN
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

DELIMITER ;
