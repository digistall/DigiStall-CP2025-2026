-- Migration: 104_getStallsFiltered.sql
-- Description: getStallsFiltered stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallsFiltered`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallsFiltered` (IN `p_stall_id` INT, IN `p_branch_id` INT, IN `p_price_type` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_is_available` TINYINT)   BEGIN
    SET @sql = 'SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE 1=1';
    
    IF p_stall_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.stall_id = ', p_stall_id);
    END IF;
    
    IF p_branch_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND b.branch_id = ', p_branch_id);
    END IF;
    
    IF p_price_type IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.price_type = "', p_price_type, '"');
    END IF;
    
    IF p_status IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.status = "', p_status, '"');
    END IF;
    
    IF p_is_available IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.is_available = ', p_is_available);
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY b.branch_name, f.floor_name, sec.section_name, s.stall_no');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;
