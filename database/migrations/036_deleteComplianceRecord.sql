-- Migration: 036_deleteComplianceRecord.sql
-- Description: deleteComplianceRecord stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteComplianceRecord`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteComplianceRecord` (IN `p_report_id` INT)   BEGIN
  DELETE FROM `violation_report` WHERE report_id = p_report_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;
