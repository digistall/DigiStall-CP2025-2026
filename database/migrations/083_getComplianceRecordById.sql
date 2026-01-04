-- Migration: 083_getComplianceRecordById.sql
-- Description: getComplianceRecordById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getComplianceRecordById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getComplianceRecordById` (IN `p_report_id` INT)   BEGIN
  SELECT * FROM `view_compliance_records`
  WHERE compliance_id = p_report_id;
END$$

DELIMITER ;
