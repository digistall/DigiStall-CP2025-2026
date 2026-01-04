-- Migration: 125_resolveComplaint.sql
-- Description: resolveComplaint stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `resolveComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `resolveComplaint` (IN `p_complaint_id` INT, IN `p_resolution_notes` TEXT, IN `p_status` VARCHAR(20))   BEGIN
  UPDATE complaint
  SET
    status = COALESCE(p_status, 'resolved'),
    resolution_notes = p_resolution_notes,
    date_resolved = NOW()
  WHERE complaint_id = p_complaint_id;
  
  SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;
