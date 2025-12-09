-- Migration: 098_getStallBusinessOwnerByUsernameLogin.sql
-- Description: getStallBusinessOwnerByUsernameLogin stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallBusinessOwnerByUsernameLogin`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallBusinessOwnerByUsernameLogin` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT 
        `business_owner_id`,
        `owner_username`,
        `owner_password_hash`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        'stall_business_owner' as role
    FROM `stall_business_owner` 
    WHERE `owner_username` = p_username 
    AND `status` = 'Active';
END$$

DELIMITER ;
