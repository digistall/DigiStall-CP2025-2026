-- Migration: 086_getEmailTemplate.sql
-- Description: getEmailTemplate stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getEmailTemplate`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getEmailTemplate` (IN `p_template_name` VARCHAR(100))   BEGIN
    SELECT * FROM employee_email_template 
    WHERE template_name = p_template_name AND is_active = 1;
END$$

DELIMITER ;
