-- Stored Procedure: logoutBusinessEmployee
-- Run this in MySQL Workbench
-- Make sure to select your database first (USE naga_stall;)

DROP PROCEDURE IF EXISTS `logoutBusinessEmployee`;

CREATE PROCEDURE `logoutBusinessEmployee` (IN `p_session_token` VARCHAR(255))
BEGIN
    DECLARE v_employee_id INT DEFAULT NULL;
    
    -- Get the employee ID from the session
    SELECT `business_employee_id` INTO v_employee_id 
    FROM `employee_session` 
    WHERE `session_token` = p_session_token AND `is_active` = 1
    LIMIT 1;
    
    -- Update the session to inactive
    UPDATE `employee_session` 
    SET `is_active` = 0, `logout_time` = NOW()
    WHERE `session_token` = p_session_token AND `is_active` = 1;
    
    -- Update last_logout in business_employee table
    IF v_employee_id IS NOT NULL THEN
        UPDATE `business_employee` 
        SET `last_logout` = NOW()
        WHERE `business_employee_id` = v_employee_id;
    END IF;
    
    SELECT ROW_COUNT() AS affected_rows;
END;
