-- Migration: 046_getAllBusinessEmployees.sql
-- Description: getAllBusinessEmployees stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllBusinessEmployees`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllBusinessEmployees` (IN `p_status` VARCHAR(20), IN `p_branch_id` INT, IN `p_limit` INT, IN `p_offset` INT)   BEGIN
    SET @sql = 'SELECT 
        e.business_employee_id,
        e.employee_username,
        e.first_name,
        e.last_name,
        e.email,
        e.phone_number,
        e.branch_id,
        e.permissions,
        e.status,
        e.last_login,
        e.created_at,
        b.branch_name
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id';
    
    SET @where_conditions = '';
    
    IF p_status IS NOT NULL THEN
        SET @where_conditions = CONCAT(@where_conditions, ' AND e.status = "', p_status, '"');
    END IF;
    
    IF p_branch_id IS NOT NULL THEN
        SET @where_conditions = CONCAT(@where_conditions, ' AND e.branch_id = ', p_branch_id);
    END IF;
    
    IF LENGTH(@where_conditions) > 0 THEN
        SET @sql = CONCAT(@sql, ' WHERE ', SUBSTRING(@where_conditions, 6));
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY e.created_at DESC');
    
    IF p_limit IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', p_limit);
        IF p_offset IS NOT NULL THEN
            SET @sql = CONCAT(@sql, ' OFFSET ', p_offset);
        END IF;
    END IF;
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;
