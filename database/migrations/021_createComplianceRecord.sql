-- Migration: 021_createComplianceRecord.sql
-- Description: createComplianceRecord stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createComplianceRecord`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createComplianceRecord` (IN `p_inspector_id` INT, IN `p_stallholder_id` INT, IN `p_violation_id` INT, IN `p_stall_id` INT, IN `p_branch_id` INT, IN `p_compliance_type` VARCHAR(100), IN `p_severity` VARCHAR(20), IN `p_remarks` TEXT, IN `p_offense_no` INT, IN `p_penalty_id` INT)   BEGIN
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
END$$

DELIMITER ;
