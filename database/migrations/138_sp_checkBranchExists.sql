-- Migration: 138_sp_checkBranchExists.sql
-- Description: sp_checkBranchExists stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkBranchExists`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkBranchExists` (IN `p_branch_name` VARCHAR(100), IN `p_area` VARCHAR(100), IN `p_location` VARCHAR(100))   BEGIN
  SELECT branch_id FROM branch 
  WHERE branch_name = p_branch_name 
    OR (area = p_area AND location = p_location);
END$$

DELIMITER ;
