-- Migration: 005_checkComplianceRecordExists.sql
-- Description: Checks if a compliance record exists by report ID
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `checkComplianceRecordExists`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkComplianceRecordExists` (IN `p_report_id` INT)   BEGIN
  SELECT COUNT(*) AS record_exists
  FROM violation_report
  WHERE report_id = p_report_id;
END$$

DELIMITER ;
