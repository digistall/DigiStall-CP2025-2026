-- Migration: 096_getStallBusinessOwnerById.sql
-- Description: getStallBusinessOwnerById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallBusinessOwnerById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallBusinessOwnerById` (IN `p_business_owner_id` INT)   BEGIN
    SELECT * FROM `stall_business_owner` 
    WHERE `business_owner_id` = p_business_owner_id;
END$$

DELIMITER ;
