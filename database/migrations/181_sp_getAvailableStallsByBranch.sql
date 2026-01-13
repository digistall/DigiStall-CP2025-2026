-- Migration: 181_sp_getAvailableStallsByBranch.sql
-- Description: sp_getAvailableStallsByBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getAvailableStallsByBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAvailableStallsByBranch` (IN `p_branch_id` INT)   BEGIN
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
        s.description,
        si.image_url as stall_image,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE b.branch_id = p_branch_id
    AND s.is_available = 1
    AND s.status = 'Active'
    AND s.stall_id NOT IN (
        SELECT stall_id FROM stallholder WHERE contract_status = 'Active'
    )
    ORDER BY s.stall_no ASC;
END$$

DELIMITER ;
