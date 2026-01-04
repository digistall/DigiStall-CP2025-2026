-- Migration: 109_getViolationPenaltiesByViolationId.sql
-- Description: getViolationPenaltiesByViolationId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getViolationPenaltiesByViolationId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getViolationPenaltiesByViolationId` (IN `p_violation_id` INT)   BEGIN
  SELECT 
    penalty_id,
    violation_id,
    offense_no,
    penalty_amount,
    remarks
  FROM violation_penalty
  WHERE violation_id = p_violation_id
  ORDER BY offense_no;
END$$

DELIMITER ;
