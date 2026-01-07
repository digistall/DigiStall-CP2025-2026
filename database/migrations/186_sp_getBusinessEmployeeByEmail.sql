-- Migration: 186_sp_getBusinessEmployeeByEmail.sql
-- Description: sp_getBusinessEmployeeByEmail stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getBusinessEmployeeByEmail`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBusinessEmployeeByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM business_employee WHERE email = p_email AND status = 'Active';
END$$

DELIMITER ;
