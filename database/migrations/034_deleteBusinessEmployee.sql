-- Migration: 034_deleteBusinessEmployee.sql
-- Description: deleteBusinessEmployee stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteBusinessEmployee`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteBusinessEmployee` (IN `p_employee_id` INT)   BEGIN
    UPDATE `business_employee` 
    SET `status` = 'Inactive', `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    -- Terminate all active sessions
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `business_employee_id` = p_employee_id AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
