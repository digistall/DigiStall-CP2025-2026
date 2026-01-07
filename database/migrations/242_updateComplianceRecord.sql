-- Migration: 242_updateComplianceRecord.sql
-- Description: updateComplianceRecord stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateComplianceRecord`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateComplianceRecord` (IN `p_report_id` INT, IN `p_status` VARCHAR(20), IN `p_remarks` TEXT, IN `p_resolved_by` INT)   BEGIN
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
END$$

DELIMITER ;
