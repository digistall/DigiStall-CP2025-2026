-- Migration: 057_getAllViolationTypes.sql
-- Description: getAllViolationTypes stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllViolationTypes`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllViolationTypes` ()   BEGIN
  SELECT 
    violation_id,
    ordinance_no,
    violation_type,
    details
  FROM violation
  ORDER BY violation_type;
END$$

DELIMITER ;
