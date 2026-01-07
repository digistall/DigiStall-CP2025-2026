-- Migration: 122_resetStallBusinessOwnerPassword.sql
-- Description: resetStallBusinessOwnerPassword stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `resetStallBusinessOwnerPassword`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resetStallBusinessOwnerPassword` (IN `p_business_owner_id` INT, IN `p_new_password_hash` VARCHAR(255))   BEGIN
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
