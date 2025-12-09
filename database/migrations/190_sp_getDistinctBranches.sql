-- Migration: 190_sp_getDistinctBranches.sql
-- Description: sp_getDistinctBranches stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getDistinctBranches`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getDistinctBranches` ()   BEGIN
  SELECT DISTINCT branch_name as branch FROM branch WHERE status = 'Active' ORDER BY branch_name;
END$$

DELIMITER ;
