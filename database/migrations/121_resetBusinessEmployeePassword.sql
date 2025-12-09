-- Migration: 121_resetBusinessEmployeePassword.sql
-- Description: resetBusinessEmployeePassword stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `resetBusinessEmployeePassword`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resetBusinessEmployeePassword` (IN `p_employee_id` INT, IN `p_new_password_hash` VARCHAR(255), IN `p_reset_by` INT)   BEGIN
    UPDATE `business_employee` 
    SET 
        `employee_password_hash` = p_new_password_hash,
        `password_reset_required` = true,
        `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    -- Terminate all active sessions
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `business_employee_id` = p_employee_id AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
