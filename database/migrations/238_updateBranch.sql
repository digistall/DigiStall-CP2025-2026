-- Migration: 238_updateBranch.sql
-- Description: updateBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBranch` (IN `p_branch_id` INT, IN `p_branch_name` VARCHAR(100), IN `p_area` VARCHAR(100), IN `p_location` VARCHAR(255), IN `p_address` TEXT, IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(100), IN `p_status` ENUM('Active','Inactive','Under Construction','Maintenance'))   BEGIN
    UPDATE branch
    SET 
        branch_name = COALESCE(p_branch_name, branch_name),
        area = COALESCE(p_area, area),
        location = COALESCE(p_location, location),
        address = COALESCE(p_address, address),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE branch_id = p_branch_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
