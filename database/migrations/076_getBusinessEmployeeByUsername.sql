-- Migration: 076_getBusinessEmployeeByUsername.sql
-- Description: getBusinessEmployeeByUsername stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBusinessEmployeeByUsername`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessEmployeeByUsername` (IN `p_username` VARCHAR(20))   BEGIN
    SELECT 
        e.*,
        b.`branch_name`
    FROM `business_employee` e
    LEFT JOIN `branch` b ON e.`branch_id` = b.`branch_id`
    WHERE e.`employee_username` = p_username;
END$$

DELIMITER ;
