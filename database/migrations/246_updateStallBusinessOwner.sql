-- Migration: 246_updateStallBusinessOwner.sql
-- Description: updateStallBusinessOwner stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateStallBusinessOwner`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStallBusinessOwner` (IN `p_business_owner_id` INT, IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_status` ENUM('Active','Inactive'))   BEGIN
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

DELIMITER ;
