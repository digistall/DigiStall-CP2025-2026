-- Migration: 183_sp_getBranchIdFromBusinessManager.sql
-- Description: sp_getBranchIdFromBusinessManager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getBranchIdFromBusinessManager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchIdFromBusinessManager` (IN `p_manager_id` INT)   BEGIN
  SELECT branch_id FROM business_manager WHERE business_manager_id = p_manager_id;
END$$

DELIMITER ;
