-- Migration: 018_createBusinessEmployee.sql
-- Description: createBusinessEmployee stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createBusinessEmployee`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createBusinessEmployee` (IN `p_username` VARCHAR(20), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_phone_number` VARCHAR(20), IN `p_branch_id` INT, IN `p_created_by_manager` INT, IN `p_permissions` JSON)   BEGIN
    INSERT INTO `business_employee` (
        `employee_username`, `employee_password_hash`, `first_name`, `last_name`, `email`, 
        `phone_number`, `branch_id`, `created_by_manager`, `permissions`, `status`, `password_reset_required`
    )
    VALUES (
        p_username, p_password_hash, p_first_name, p_last_name, p_email, 
        p_phone_number, p_branch_id, p_created_by_manager, p_permissions, 'Active', true
    );
    
    SELECT LAST_INSERT_ID() as business_employee_id;
END$$

DELIMITER ;
