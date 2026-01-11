-- Migration: 161_sp_deleteBranch.sql
-- Description: sp_deleteBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_deleteBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteBranch` (IN `p_branch_id` INT)   BEGIN
  DELETE FROM branch WHERE branch_id = p_branch_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
