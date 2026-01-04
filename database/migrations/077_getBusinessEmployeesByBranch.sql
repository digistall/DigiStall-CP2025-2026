-- Migration: 077_getBusinessEmployeesByBranch.sql
-- Description: getBusinessEmployeesByBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBusinessEmployeesByBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessEmployeesByBranch` (IN `p_branch_id` INT, IN `p_status` VARCHAR(20))   BEGIN
    IF p_status IS NOT NULL THEN
        SELECT 
            e.`business_employee_id`,
            e.`employee_username`,
            e.`first_name`,
            e.`last_name`,
            e.`email`,
            e.`permissions`,
            e.`status`,
            e.`last_login`,
            e.`created_at`
        FROM `business_employee` e
        WHERE e.`branch_id` = p_branch_id AND e.`status` = p_status
        ORDER BY e.`first_name`, e.`last_name`;
    ELSE
        SELECT 
            e.`business_employee_id`,
            e.`employee_username`,
            e.`first_name`,
            e.`last_name`,
            e.`email`,
            e.`permissions`,
            e.`status`,
            e.`last_login`,
            e.`created_at`
        FROM `business_employee` e
        WHERE e.`branch_id` = p_branch_id
        ORDER BY e.`first_name`, e.`last_name`;
    END IF;
END$$

DELIMITER ;
