-- Migration: 193_sp_getExistingManagerForBranch.sql
-- Description: sp_getExistingManagerForBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getExistingManagerForBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getExistingManagerForBranch` (IN `p_branch_id` INT)   BEGIN
  SELECT branch_manager_id, first_name, last_name 
  FROM branch_manager 
  WHERE branch_id = p_branch_id;
END$$

DELIMITER ;
