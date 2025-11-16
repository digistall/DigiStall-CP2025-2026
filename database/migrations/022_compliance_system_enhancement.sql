-- ===================================================================
-- Migration: 022_compliance_system_enhancement
-- Description: Enhanced compliance/violation system with status tracking
-- Date: 2025-11-16
-- ===================================================================

-- Add status column to violation_report for tracking resolution progress
ALTER TABLE `violation_report` 
ADD COLUMN IF NOT EXISTS `status` ENUM('pending', 'in-progress', 'complete', 'incomplete') 
DEFAULT 'pending' 
AFTER `remarks`;

-- Add resolution date tracking
ALTER TABLE `violation_report` 
ADD COLUMN IF NOT EXISTS `resolved_date` DATETIME NULL 
AFTER `status`;

-- Add resolved by tracking (which employee/manager resolved it)
ALTER TABLE `violation_report` 
ADD COLUMN IF NOT EXISTS `resolved_by` INT NULL 
AFTER `resolved_date`;

-- Add compliance type for better categorization
ALTER TABLE `violation_report` 
ADD COLUMN IF NOT EXISTS `compliance_type` VARCHAR(100) NULL 
AFTER `violation_id`,
ADD INDEX `idx_compliance_type` (`compliance_type`);

-- Add severity level
ALTER TABLE `violation_report` 
ADD COLUMN IF NOT EXISTS `severity` ENUM('minor', 'moderate', 'major', 'critical') 
DEFAULT 'moderate' 
AFTER `compliance_type`;

-- Update existing records to have 'complete' status if they're old
UPDATE `violation_report` 
SET `status` = 'complete' 
WHERE `date_reported` < DATE_SUB(NOW(), INTERVAL 30 DAY) 
AND `status` IS NULL;

-- Update existing records to have 'pending' status if they're recent
UPDATE `violation_report` 
SET `status` = 'pending' 
WHERE `status` IS NULL;

-- Create an index for better query performance
ALTER TABLE `violation_report` 
ADD INDEX `idx_status` (`status`),
ADD INDEX `idx_date_reported` (`date_reported`),
ADD INDEX `idx_severity` (`severity`);

-- Insert sample compliance types based on existing violations
UPDATE `violation_report` vr
INNER JOIN `violation` v ON vr.violation_id = v.violation_id
SET vr.compliance_type = v.violation_type
WHERE vr.compliance_type IS NULL;

-- Record migration
INSERT INTO `migrations` (`migration_name`, `version`, `executed_at`) 
VALUES ('022_compliance_system_enhancement', '1.0.0', NOW());

-- ===================================================================
-- Sample Data Updates for Testing
-- ===================================================================

-- Update existing violation reports with realistic statuses
UPDATE `violation_report` 
SET 
  `status` = 'complete',
  `resolved_date` = DATE_ADD(`date_reported`, INTERVAL 7 DAY),
  `severity` = 'minor'
WHERE `report_id` = 1;

UPDATE `violation_report` 
SET 
  `status` = 'pending',
  `severity` = 'moderate'
WHERE `report_id` = 2;

-- ===================================================================
-- Views for Compliance Reporting
-- ===================================================================

-- Drop existing view if exists
DROP VIEW IF EXISTS `view_compliance_records`;

-- Create enhanced compliance view
CREATE VIEW `view_compliance_records` AS
SELECT 
  vr.report_id AS compliance_id,
  vr.date_reported AS date,
  COALESCE(vr.compliance_type, v.violation_type) AS type,
  CONCAT(i.first_name, ' ', i.last_name) AS inspector,
  sh.stallholder_name AS stallholder,
  vr.status,
  vr.severity,
  vr.remarks AS notes,
  vr.resolved_date,
  b.branch_name,
  b.branch_id,
  s.stall_no,
  vr.offense_no,
  vp.penalty_amount,
  vr.stallholder_id,
  vr.stall_id,
  vr.inspector_id,
  vr.violation_id
FROM `violation_report` vr
LEFT JOIN `inspector` i ON vr.inspector_id = i.inspector_id
LEFT JOIN `stallholder` sh ON vr.stallholder_id = sh.stallholder_id
LEFT JOIN `violation` v ON vr.violation_id = v.violation_id
LEFT JOIN `branch` b ON vr.branch_id = b.branch_id
LEFT JOIN `stall` s ON vr.stall_id = s.stall_id
LEFT JOIN `violation_penalty` vp ON vr.penalty_id = vp.penalty_id
ORDER BY vr.date_reported DESC;

-- ===================================================================
-- Stored Procedures for Compliance Management
-- ===================================================================

DELIMITER //

-- Get all compliance records with filters
DROP PROCEDURE IF EXISTS `getAllComplianceRecords`//
CREATE PROCEDURE `getAllComplianceRecords`(
  IN p_branch_id INT,
  IN p_status VARCHAR(20),
  IN p_search VARCHAR(255)
)
BEGIN
  SELECT * FROM `view_compliance_records`
  WHERE 
    (p_branch_id IS NULL OR branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status = 'all' OR status = p_status)
    AND (
      p_search IS NULL OR p_search = '' OR
      compliance_id LIKE CONCAT('%', p_search, '%') OR
      type LIKE CONCAT('%', p_search, '%') OR
      inspector LIKE CONCAT('%', p_search, '%') OR
      stallholder LIKE CONCAT('%', p_search, '%')
    )
  ORDER BY date DESC;
END//

-- Get single compliance record
DROP PROCEDURE IF EXISTS `getComplianceRecordById`//
CREATE PROCEDURE `getComplianceRecordById`(IN p_report_id INT)
BEGIN
  SELECT * FROM `view_compliance_records`
  WHERE compliance_id = p_report_id;
END//

-- Create new compliance/violation report
DROP PROCEDURE IF EXISTS `createComplianceRecord`//
CREATE PROCEDURE `createComplianceRecord`(
  IN p_inspector_id INT,
  IN p_stallholder_id INT,
  IN p_violation_id INT,
  IN p_stall_id INT,
  IN p_branch_id INT,
  IN p_compliance_type VARCHAR(100),
  IN p_severity VARCHAR(20),
  IN p_remarks TEXT,
  IN p_offense_no INT,
  IN p_penalty_id INT
)
BEGIN
  INSERT INTO `violation_report` (
    inspector_id, stallholder_id, violation_id, stall_id, branch_id,
    compliance_type, severity, remarks, offense_no, penalty_id, 
    date_reported, status
  ) VALUES (
    p_inspector_id, p_stallholder_id, p_violation_id, p_stall_id, p_branch_id,
    p_compliance_type, p_severity, p_remarks, p_offense_no, p_penalty_id,
    NOW(), 'pending'
  );
  
  -- Update stallholder compliance status if violation
  IF p_violation_id IS NOT NULL THEN
    UPDATE `stallholder` 
    SET 
      compliance_status = 'Non-Compliant',
      last_violation_date = NOW()
    WHERE stallholder_id = p_stallholder_id;
  END IF;
  
  SELECT LAST_INSERT_ID() AS report_id;
END//

-- Update compliance record
DROP PROCEDURE IF EXISTS `updateComplianceRecord`//
CREATE PROCEDURE `updateComplianceRecord`(
  IN p_report_id INT,
  IN p_status VARCHAR(20),
  IN p_remarks TEXT,
  IN p_resolved_by INT
)
BEGIN
  DECLARE v_resolved_date DATETIME;
  
  -- If status is complete, set resolved date
  IF p_status = 'complete' THEN
    SET v_resolved_date = NOW();
  ELSE
    SET v_resolved_date = NULL;
  END IF;
  
  UPDATE `violation_report` 
  SET 
    status = p_status,
    remarks = COALESCE(p_remarks, remarks),
    resolved_date = v_resolved_date,
    resolved_by = p_resolved_by
  WHERE report_id = p_report_id;
  
  -- If resolved, check if stallholder should be marked compliant
  IF p_status = 'complete' THEN
    -- Get stallholder_id from the report
    SELECT stallholder_id INTO @sh_id FROM violation_report WHERE report_id = p_report_id;
    
    -- Check if stallholder has any pending violations
    IF NOT EXISTS (
      SELECT 1 FROM violation_report 
      WHERE stallholder_id = @sh_id 
      AND status IN ('pending', 'in-progress')
    ) THEN
      UPDATE `stallholder` 
      SET compliance_status = 'Compliant'
      WHERE stallholder_id = @sh_id;
    END IF;
  END IF;
  
  SELECT ROW_COUNT() AS affected_rows;
END//

-- Delete compliance record
DROP PROCEDURE IF EXISTS `deleteComplianceRecord`//
CREATE PROCEDURE `deleteComplianceRecord`(IN p_report_id INT)
BEGIN
  DELETE FROM `violation_report` WHERE report_id = p_report_id;
  SELECT ROW_COUNT() AS affected_rows;
END//

-- Get compliance statistics
DROP PROCEDURE IF EXISTS `getComplianceStatistics`//
CREATE PROCEDURE `getComplianceStatistics`(IN p_branch_id INT)
BEGIN
  SELECT 
    COUNT(*) AS total_records,
    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_count,
    SUM(CASE WHEN status = 'in-progress' THEN 1 ELSE 0 END) AS in_progress_count,
    SUM(CASE WHEN status = 'complete' THEN 1 ELSE 0 END) AS complete_count,
    SUM(CASE WHEN status = 'incomplete' THEN 1 ELSE 0 END) AS incomplete_count,
    SUM(CASE WHEN severity = 'critical' THEN 1 ELSE 0 END) AS critical_count,
    SUM(CASE WHEN severity = 'major' THEN 1 ELSE 0 END) AS major_count
  FROM `violation_report`
  WHERE p_branch_id IS NULL OR branch_id = p_branch_id;
END//

DELIMITER ;

-- ===================================================================
-- Grant necessary permissions (if needed)
-- ===================================================================

-- These would be executed based on your user setup
-- GRANT EXECUTE ON PROCEDURE getAllComplianceRecords TO 'your_user'@'localhost';
-- GRANT EXECUTE ON PROCEDURE getComplianceRecordById TO 'your_user'@'localhost';
-- etc.

-- ===================================================================
-- End of Migration
-- ===================================================================
