-- Migration: 188_sp_getBusinessManagerByEmail.sql
-- Description: sp_getBusinessManagerByEmail stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getBusinessManagerByEmail`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBusinessManagerByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM business_manager WHERE email = p_email AND status = 'Active';
END$$

DELIMITER ;
