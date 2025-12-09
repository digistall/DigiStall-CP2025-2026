-- Migration: 182_sp_getBranchById.sql
-- Description: sp_getBranchById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getBranchById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchById` (IN `p_branch_id` INT)   BEGIN
  SELECT branch_id, branch_name FROM branch WHERE branch_id = p_branch_id;
END$$

DELIMITER ;
