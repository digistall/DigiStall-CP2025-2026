-- Migration: 017_createBranch.sql
-- Description: createBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createBranch` (IN `p_business_owner_id` INT, IN `p_branch_name` VARCHAR(100), IN `p_area` VARCHAR(100), IN `p_location` VARCHAR(255), IN `p_address` TEXT, IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_status` ENUM('Active','Inactive','Under Construction','Maintenance'))   BEGIN
    INSERT INTO `branch` (
        `business_owner_id`, 
        `branch_name`, 
        `area`, 
        `location`, 
        `address`, 
        `contact_number`, 
        `email`, 
        `status`
    )
    VALUES (
        p_business_owner_id, 
        p_branch_name, 
        p_area, 
        p_location, 
        p_address, 
        p_contact_number, 
        p_email, 
        COALESCE(p_status, 'Active')
    );
    
    SELECT LAST_INSERT_ID() as branch_id;
END$$

DELIMITER ;
