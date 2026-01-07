-- Migration: 201_sp_getLandingPageStalls.sql
-- Description: sp_getLandingPageStalls stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLandingPageStalls`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLandingPageStalls` (IN `p_search` VARCHAR(255), IN `p_branch_filter` INT, IN `p_status_filter` VARCHAR(50), IN `p_price_type_filter` VARCHAR(50), IN `p_page` INT, IN `p_limit` INT)   BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;
    
    
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.rental_price,
        s.price_type,
        s.status,
        s.is_available,
        s.description,
        si.image_url as stall_image,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.branch_id,
        CASE WHEN sh.stallholder_id IS NOT NULL THEN 'Occupied' ELSE 'Available' END as occupancy_status
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE (p_search IS NULL OR p_search = '' OR 
           s.stall_no LIKE CONCAT('%', p_search, '%') OR
           s.stall_location LIKE CONCAT('%', p_search, '%') OR
           sec.section_name LIKE CONCAT('%', p_search, '%') OR
           f.floor_name LIKE CONCAT('%', p_search, '%') OR
           b.branch_name LIKE CONCAT('%', p_search, '%'))
    AND (p_branch_filter IS NULL OR p_branch_filter = 0 OR b.branch_id = p_branch_filter)
    AND (p_status_filter IS NULL OR p_status_filter = '' OR s.status = p_status_filter
         OR (p_status_filter = 'Occupied' AND sh.stallholder_id IS NOT NULL)
         OR (p_status_filter = 'Available' AND sh.stallholder_id IS NULL))
    AND (p_price_type_filter IS NULL OR p_price_type_filter = '' OR s.price_type = p_price_type_filter)
    ORDER BY b.branch_name, f.floor_name, s.stall_no ASC
    LIMIT p_limit OFFSET v_offset;
END$$

DELIMITER ;
