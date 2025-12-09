-- Migration: 245_updateStall.sql
-- Description: updateStall stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateStall`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStall` (IN `p_stall_id` INT, IN `p_stall_no` VARCHAR(20), IN `p_stall_location` VARCHAR(100), IN `p_size` VARCHAR(50), IN `p_rental_price` DECIMAL(10,2), IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), IN `p_description` TEXT)   BEGIN
    UPDATE stall
    SET 
        stall_no = COALESCE(p_stall_no, stall_no),
        stall_location = COALESCE(p_stall_location, stall_location),
        size = COALESCE(p_size, size),
        rental_price = COALESCE(p_rental_price, rental_price),
        status = COALESCE(p_status, status),
        description = COALESCE(p_description, description),
        updated_at = NOW()
    WHERE stall_id = p_stall_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
