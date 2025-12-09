-- Migration: 211_sp_getStallById.sql
-- Description: sp_getStallById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getStallById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getStallById` (IN `p_stall_id` INT)   BEGIN
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.floor_id,
        f.floor_name,
        s.section_id,
        sec.section_name,
        s.rental_price,
        s.price_type,
        s.status,
        s.stamp,
        s.description,
        si.image_url as stall_image,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.raffle_auction_start_time,
        s.raffle_auction_end_time,
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN business_manager bm ON s.created_by_business_manager = bm.business_manager_id
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE s.stall_id = p_stall_id;
END$$

DELIMITER ;
