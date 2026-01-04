-- Migration: 075_getBusinessEmployeeById.sql
-- Description: getBusinessEmployeeById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBusinessEmployeeById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessEmployeeById` (IN `p_employee_id` INT)   BEGIN
    SELECT 
        e.*,
        b.`branch_name`,
        bm.`first_name` as created_by_first_name,
        bm.`last_name` as created_by_last_name
    FROM `business_employee` e
    LEFT JOIN `branch` b ON e.`branch_id` = b.`branch_id`
    LEFT JOIN `business_manager` bm ON e.`created_by_manager` = bm.`business_manager_id`
    WHERE e.`business_employee_id` = p_employee_id;
END$$

DELIMITER ;
