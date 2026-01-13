-- Migration: 052_getAllStallBusinessOwners.sql
-- Description: getAllStallBusinessOwners stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllStallBusinessOwners`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllStallBusinessOwners` ()   BEGIN
    SELECT 
        sbo.`business_owner_id`,
        sbo.`owner_username`,
        sbo.`first_name`,
        sbo.`last_name`,
        sbo.`contact_number`,
        sbo.`email`,
        sbo.`status`,
        sbo.`created_at`,
        sbo.`updated_at`,
        CONCAT(sa.`first_name`, ' ', sa.`last_name`) as created_by_name
    FROM `stall_business_owner` sbo
    LEFT JOIN `system_administrator` sa ON sbo.`created_by_system_admin` = sa.`system_admin_id`
    ORDER BY sbo.`created_at` DESC;
END$$

DELIMITER ;
