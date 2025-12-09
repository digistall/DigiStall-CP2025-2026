-- Migration: 141_sp_checkManagerExistsForBranch.sql
-- Description: sp_checkManagerExistsForBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkManagerExistsForBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerExistsForBranch` (IN `p_branch_id` INT)   BEGIN
  SELECT branch_manager_id FROM branch_manager WHERE branch_id = p_branch_id;
END$$

DELIMITER ;
