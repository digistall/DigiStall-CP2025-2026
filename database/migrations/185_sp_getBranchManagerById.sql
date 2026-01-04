-- Migration: 185_sp_getBranchManagerById.sql
-- Description: sp_getBranchManagerById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getBranchManagerById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchManagerById` (IN `p_manager_id` INT)   BEGIN
  SELECT branch_manager_id, branch_id, manager_username 
  FROM branch_manager 
  WHERE branch_manager_id = p_manager_id;
END$$

DELIMITER ;
