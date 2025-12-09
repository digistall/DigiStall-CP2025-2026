-- Migration: 035_deleteComplaint.sql
-- Description: deleteComplaint stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteComplaint`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteComplaint` (IN `p_complaint_id` INT)   BEGIN
  DELETE FROM complaint WHERE complaint_id = p_complaint_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;
