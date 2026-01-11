-- Migration: 240_updateBusinessManager.sql
-- Description: updateBusinessManager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateBusinessManager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBusinessManager` (IN `p_manager_id` INT, IN `p_first_name` VARCHAR(50), IN `p_last_name` VARCHAR(50), IN `p_email` VARCHAR(100), IN `p_contact_number` VARCHAR(20), IN `p_status` ENUM('Active','Inactive'))   BEGIN
    UPDATE `business_manager`
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `email` = COALESCE(p_email, `email`),
        `contact_number` = COALESCE(p_contact_number, `contact_number`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_manager_id` = p_manager_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
