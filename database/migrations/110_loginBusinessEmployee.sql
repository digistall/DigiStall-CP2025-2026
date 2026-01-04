-- Migration: 110_loginBusinessEmployee.sql
-- Description: loginBusinessEmployee stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `loginBusinessEmployee`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `loginBusinessEmployee` (IN `p_username` VARCHAR(20), IN `p_session_token` VARCHAR(255), IN `p_ip_address` VARCHAR(45), IN `p_user_agent` TEXT)   BEGIN
    DECLARE v_employee_id INT DEFAULT NULL;
    
    -- Get employee ID
    SELECT `business_employee_id` INTO v_employee_id 
    FROM `business_employee` 
    WHERE `employee_username` = p_username AND `status` = 'Active';
    
    IF v_employee_id IS NOT NULL THEN
        -- Create session
        INSERT INTO `employee_session` (`business_employee_id`, `session_token`, `ip_address`, `user_agent`, `is_active`)
        VALUES (v_employee_id, p_session_token, p_ip_address, p_user_agent, true);
        
        -- Update last login
        UPDATE `business_employee` SET `last_login` = NOW() WHERE `business_employee_id` = v_employee_id;
        
        SELECT v_employee_id as business_employee_id, 'success' as status;
    ELSE
        SELECT NULL as business_employee_id, 'failed' as status;
    END IF;
END$$

DELIMITER ;
