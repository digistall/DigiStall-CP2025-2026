-- Migration: 239_updateBusinessEmployee.sql
-- Description: updateBusinessEmployee stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateBusinessEmployee`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBusinessEmployee` (IN `p_employee_id` INT, IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_phone_number` VARCHAR(20), IN `p_permissions` JSON, IN `p_status` VARCHAR(20))   BEGIN
    UPDATE `business_employee` 
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `email` = COALESCE(p_email, `email`),
        `phone_number` = COALESCE(p_phone_number, `phone_number`),
        `permissions` = COALESCE(p_permissions, `permissions`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
