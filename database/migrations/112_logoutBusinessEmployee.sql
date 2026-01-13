-- Migration: 112_logoutBusinessEmployee.sql
-- Description: logoutBusinessEmployee stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `logoutBusinessEmployee`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `logoutBusinessEmployee` (IN `p_session_token` VARCHAR(255))   BEGIN
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `session_token` = p_session_token AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
