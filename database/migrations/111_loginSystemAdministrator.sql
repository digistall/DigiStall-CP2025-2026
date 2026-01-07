-- Migration: 111_loginSystemAdministrator.sql
-- Description: loginSystemAdministrator stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `loginSystemAdministrator`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `loginSystemAdministrator` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        `system_admin_id`,
        `username`,
        `password_hash`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        'system_administrator' as role
    FROM `system_administrator`
    WHERE `username` = p_username 
    AND `status` = 'Active'
    LIMIT 1;
END$$

DELIMITER ;
