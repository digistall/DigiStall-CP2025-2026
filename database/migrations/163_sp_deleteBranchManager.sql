-- Migration: 163_sp_deleteBranchManager.sql
-- Description: sp_deleteBranchManager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_deleteBranchManager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteBranchManager` (IN `p_manager_id` INT)   BEGIN
  DELETE FROM branch_manager WHERE branch_manager_id = p_manager_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
