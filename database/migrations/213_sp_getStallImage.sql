-- Migration: 213_sp_getStallImage.sql
-- Description: sp_getStallImage stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getStallImage`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getStallImage` (IN `p_stall_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no,
        si.image_url as stall_image,
        s.stall_location,
        s.size,
        s.rental_price,
        s.status,
        s.description,
        sec.section_name,
        f.floor_name,
        b.branch_name
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE s.stall_id = p_stall_id;
END$$

DELIMITER ;
