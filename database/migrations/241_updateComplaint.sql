-- Migration: 241_updateComplaint.sql
-- Description: updateComplaint stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateComplaint` (IN `p_complaint_id` INT, IN `p_complaint_type` VARCHAR(100), IN `p_subject` VARCHAR(255), IN `p_description` TEXT, IN `p_priority` VARCHAR(20), IN `p_status` VARCHAR(20))   BEGIN
  UPDATE complaint
  SET
    complaint_type = COALESCE(p_complaint_type, complaint_type),
    subject = COALESCE(p_subject, subject),
    description = COALESCE(p_description, description),
    priority = COALESCE(p_priority, priority),
    status = COALESCE(p_status, status)
  WHERE complaint_id = p_complaint_id;
  
  SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;
