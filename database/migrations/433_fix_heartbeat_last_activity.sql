-- Migration: 433_fix_heartbeat_last_activity.sql
-- Description: Fix heartbeat to update employee_session.last_activity for accurate "Last Activity" display
-- Date: January 2026

DELIMITER //

-- =====================================================
-- Fix: sp_heartbeatBusinessEmployee
-- Updates both business_employee.last_login AND employee_session.last_activity
-- =====================================================
DROP PROCEDURE IF EXISTS sp_heartbeatBusinessEmployee//
CREATE PROCEDURE sp_heartbeatBusinessEmployee(
    IN p_id INT,
    IN p_time DATETIME
)
BEGIN
    -- Update last_login in business_employee table
    UPDATE business_employee SET last_login = p_time WHERE business_employee_id = p_id;
    
    -- Also update last_activity in employee_session table for accurate dashboard display
    UPDATE employee_session 
    SET last_activity = p_time 
    WHERE business_employee_id = p_id AND is_active = 1;
END//

DELIMITER ;
