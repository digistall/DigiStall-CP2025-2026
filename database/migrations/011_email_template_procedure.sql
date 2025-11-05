-- Additional Email Template Procedure
-- Execute this in phpMyAdmin after 010_missing_stored_procedures.sql

DELIMITER $$

CREATE PROCEDURE IF NOT EXISTS `getEmailTemplate`(IN `p_template_name` VARCHAR(100))
BEGIN
    SELECT * FROM employee_email_template 
    WHERE template_name = p_template_name AND is_active = TRUE
    LIMIT 1;
END$$

DELIMITER ;
