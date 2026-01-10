-- =============================================
-- 512: Add Termination Fields to business_employee
-- Adds fields to track employee termination
-- =============================================

-- Check and add termination fields to business_employee table
-- Note: If columns already exist, this will be skipped or error (run individually)

-- First, try to add termination_date
SET @dbname = DATABASE();
SET @tablename = 'business_employee';
SET @columnname = 'termination_date';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' DATE DEFAULT NULL AFTER updated_at')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Then, try to add termination_reason
SET @columnname = 'termination_reason';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE
      (table_name = @tablename)
      AND (table_schema = @dbname)
      AND (column_name = @columnname)
  ) > 0,
  'SELECT 1',
  CONCAT('ALTER TABLE ', @tablename, ' ADD COLUMN ', @columnname, ' VARCHAR(500) DEFAULT NULL AFTER termination_date')
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Update sp_terminateEmployee to soft delete (set status to Inactive)
DELIMITER $$

DROP PROCEDURE IF EXISTS sp_terminateEmployee$$
CREATE PROCEDURE sp_terminateEmployee(
    IN p_employee_id INT,
    IN p_reason VARCHAR(500)
)
BEGIN
    -- Soft delete: Update status to Inactive and record termination details
    UPDATE business_employee 
    SET status = 'Inactive', 
        termination_date = CURDATE(),
        termination_reason = p_reason
    WHERE business_employee_id = p_employee_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

SELECT '✅ Migration 512 Complete - Termination fields added to business_employee!' as status;
