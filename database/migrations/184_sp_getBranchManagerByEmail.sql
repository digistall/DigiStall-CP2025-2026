-- Migration: 184_sp_getBranchManagerByEmail.sql
-- Description: sp_getBranchManagerByEmail stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getBranchManagerByEmail`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBranchManagerByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM branch_manager WHERE email = p_email AND status = 'Active';
END$$

DELIMITER ;
