-- Migration: 142_sp_checkManagerExistsForDifferentBranch.sql
-- Description: sp_checkManagerExistsForDifferentBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkManagerExistsForDifferentBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerExistsForDifferentBranch` (IN `p_username` VARCHAR(100), IN `p_branch_id` INT)   BEGIN
  SELECT branch_manager_id, branch_id 
  FROM branch_manager 
  WHERE manager_username = p_username AND branch_id != p_branch_id;
END$$

DELIMITER ;
