-- Migration: 200_addLastLogoutToBusinessEmployee.sql
-- Description: Add last_logout column to business_employee, collector, and inspector tables for tracking logout time
-- Date: 2026-01-01

-- Add last_logout column to business_employee (check if exists first)
SET @dbname = DATABASE();
SET @tablename = 'business_employee';
SET @columnname = 'last_logout';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL DEFAULT NULL AFTER last_login')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_logout column to collector
SET @tablename = 'collector';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL DEFAULT NULL AFTER last_login')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_logout column to inspector
SET @tablename = 'inspector';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' TIMESTAMP NULL DEFAULT NULL AFTER last_login')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;


-- Update the logoutBusinessEmployee stored procedure to also update last_logout
DELIMITER $$

DROP PROCEDURE IF EXISTS `logoutBusinessEmployee`$$

CREATE PROCEDURE `logoutBusinessEmployee` (IN `p_session_token` VARCHAR(255))
BEGIN
    DECLARE v_employee_id INT;
    
    -- Get the employee ID from the session
    SELECT `business_employee_id` INTO v_employee_id 
    FROM `employee_session` 
    WHERE `session_token` = p_session_token AND `is_active` = true
    LIMIT 1;
    
    -- Update the session to inactive
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `session_token` = p_session_token AND `is_active` = true;
    
    -- Update last_logout in business_employee table
    IF v_employee_id IS NOT NULL THEN
        UPDATE `business_employee` 
        SET `last_logout` = NOW()
        WHERE `business_employee_id` = v_employee_id;
    END IF;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
