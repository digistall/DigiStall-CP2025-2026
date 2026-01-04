-- Migration: 108_getSystemAdministratorByUsername.sql
-- Description: getSystemAdministratorByUsername stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getSystemAdministratorByUsername`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSystemAdministratorByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT * FROM `system_administrator` 
    WHERE `username` = p_username 
    AND `status` = 'Active';
END$$

DELIMITER ;
