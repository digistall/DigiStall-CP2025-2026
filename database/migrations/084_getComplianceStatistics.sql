-- Migration: 084_getComplianceStatistics.sql
-- Description: getComplianceStatistics stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getComplianceStatistics`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getComplianceStatistics` (IN `p_branch_id` INT)   BEGIN
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
END$$

DELIMITER ;
