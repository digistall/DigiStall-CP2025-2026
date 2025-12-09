-- Migration: 038_deleteStallBusinessOwner.sql
-- Description: deleteStallBusinessOwner stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteStallBusinessOwner`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteStallBusinessOwner` (IN `p_business_owner_id` INT)   BEGIN
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

DELIMITER ;
