-- Migration: 197_sp_getFloorsByBranchId.sql
-- Description: sp_getFloorsByBranchId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getFloorsByBranchId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorsByBranchId` (IN `p_branch_id` INT)   BEGIN
  SELECT f.* FROM floor f WHERE f.branch_id = p_branch_id;
END$$

DELIMITER ;
