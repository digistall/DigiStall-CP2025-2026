-- Migration: 100_getStallholderBranchId.sql
-- Description: getStallholderBranchId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallholderBranchId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholderBranchId` (IN `p_stallholder_id` INT)   BEGIN
  SELECT branch_id
  FROM stallholder
  WHERE stallholder_id = p_stallholder_id;
END$$

DELIMITER ;
