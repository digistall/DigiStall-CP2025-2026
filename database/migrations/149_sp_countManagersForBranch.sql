-- Migration: 149_sp_countManagersForBranch.sql
-- Description: sp_countManagersForBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_countManagersForBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countManagersForBranch` (IN `p_branch_id` INT)   BEGIN
  SELECT COUNT(*) as count FROM branch_manager WHERE branch_id = p_branch_id;
END$$

DELIMITER ;
