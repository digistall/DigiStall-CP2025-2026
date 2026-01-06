-- Migration: 097_getStallBusinessOwnerByUsername.sql
-- Description: getStallBusinessOwnerByUsername stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallBusinessOwnerByUsername`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallBusinessOwnerByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT * FROM `stall_business_owner` 
    WHERE `owner_username` = p_username;
END$$

DELIMITER ;
