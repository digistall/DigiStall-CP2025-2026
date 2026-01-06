-- Migration: 056_getAllSystemAdministrators.sql
-- Description: getAllSystemAdministrators stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllSystemAdministrators`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllSystemAdministrators` ()   BEGIN
    SELECT 
        `system_admin_id`,
        `username`,
        `first_name`,
        `last_name`,
        `contact_number`,
        `email`,
        `status`,
        `created_at`,
        `updated_at`
    FROM `system_administrator`
    ORDER BY `created_at` DESC;
END$$

DELIMITER ;
