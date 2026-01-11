-- Migration: 171_sp_getAdminByEmail.sql
-- Description: sp_getAdminByEmail stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getAdminByEmail`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAdminByEmail` (IN `p_email` VARCHAR(150))   BEGIN
  SELECT * FROM admin WHERE email = p_email AND status = 'Active';
END$$

DELIMITER ;
