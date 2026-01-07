-- Migration: 204_sp_getLocationsByBranch.sql
-- Description: sp_getLocationsByBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLocationsByBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLocationsByBranch` (IN `p_branch_name` VARCHAR(100))   BEGIN
  SELECT DISTINCT location, branch_name as branch 
  FROM branch 
  WHERE branch_name = p_branch_name AND status = 'Active' 
  ORDER BY location;
END$$

DELIMITER ;
