-- Migration: 194_sp_getFloorByBranchWithDetails.sql
-- Description: sp_getFloorByBranchWithDetails stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getFloorByBranchWithDetails`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorByBranchWithDetails` (IN `p_branch_id` INT)   BEGIN
  SELECT f.* FROM floor f
  JOIN branch b ON f.branch_id = b.branch_id
  WHERE f.branch_id = p_branch_id;
END$$

DELIMITER ;
