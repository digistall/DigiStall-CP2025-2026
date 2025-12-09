-- Migration: 107_getSystemAdministratorById.sql
-- Description: getSystemAdministratorById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getSystemAdministratorById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSystemAdministratorById` (IN `p_system_admin_id` INT)   BEGIN
    SELECT * FROM `system_administrator` 
    WHERE `system_admin_id` = p_system_admin_id;
END$$

DELIMITER ;
