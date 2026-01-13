-- Migration: 040_deleteSystemAdministrator.sql
-- Description: deleteSystemAdministrator stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteSystemAdministrator`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteSystemAdministrator` (IN `p_system_admin_id` INT)   BEGIN
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

DELIMITER ;
