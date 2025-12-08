-- =============================================
-- FIX ALL STALL_IMAGE REFERENCES IN STORED PROCEDURES
-- =============================================
-- Description: Updates all stored procedures to use stall_images table
-- instead of the removed stall.stall_image column
-- Date: December 7, 2025
-- =============================================

USE naga_stall;

DELIMITER $$

-- =============================================
-- 1. sp_getAllStallsByBranch
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getAllStallsByBranch`$$

CREATE PROCEDURE `sp_getAllStallsByBranch`(IN `p_branch_id` INT)
BEGIN
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
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        CASE 
            WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
            WHEN s.is_available = 1 THEN 'Available'
            ELSE 'Unavailable'
        END as availability_status,
        sh.stallholder_id,
        sh.stallholder_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE b.branch_id = p_branch_id
    ORDER BY s.created_at DESC;
END$$

-- =============================================
-- 2. sp_getAllStallsByManager
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getAllStallsByManager`$$

CREATE PROCEDURE `sp_getAllStallsByManager`(IN `p_business_manager_id` INT)
BEGIN
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
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        CASE 
            WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
            WHEN s.is_available = 1 THEN 'Available'
            ELSE 'Unavailable'
        END as availability_status,
        sh.stallholder_id,
        sh.stallholder_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
    WHERE bm.business_manager_id = p_business_manager_id
    ORDER BY s.created_at DESC;
END$$

-- =============================================
-- 3. sp_getAllStalls_complete (MAIN PROCEDURE)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getAllStalls_complete`$$

CREATE PROCEDURE `sp_getAllStalls_complete`(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_branch_id INT
)
BEGIN
    IF p_user_type = 'stall_business_owner' THEN
        -- Get stalls for ALL branches owned by this business owner
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
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id IN (
            SELECT DISTINCT bm.branch_id
            FROM business_owner_managers bom
            INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
            WHERE bom.business_owner_id = p_user_id AND bom.status = 'Active'
        )
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type = 'system_administrator' THEN
        -- System administrators see ALL stalls
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
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type = 'business_manager' THEN
        -- Get stalls for the manager's branch
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
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE bm.business_manager_id = p_user_id
        ORDER BY s.created_at DESC;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Get stalls for the employee's branch
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
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id = p_branch_id
        ORDER BY s.created_at DESC;
        
    ELSE
        -- Return empty result for unauthorized user types
        SELECT NULL LIMIT 0;
    END IF;
END$$

-- =============================================
-- 4. sp_getAvailableStallsByBranch
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getAvailableStallsByBranch`$$

CREATE PROCEDURE `sp_getAvailableStallsByBranch`(IN `p_branch_id` INT)
BEGIN
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

-- =============================================
-- 5. sp_getLandingPageStalls
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getLandingPageStalls`$$

CREATE PROCEDURE `sp_getLandingPageStalls`(
    IN `p_search` VARCHAR(255), 
    IN `p_branch_filter` INT, 
    IN `p_status_filter` VARCHAR(50), 
    IN `p_price_type_filter` VARCHAR(50), 
    IN `p_page` INT, 
    IN `p_limit` INT
)
BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;
    
    -- Return stalls with their section, floor, and branch info
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

-- =============================================
-- 6. sp_getStallById
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getStallById`$$

CREATE PROCEDURE `sp_getStallById`(IN `p_stall_id` INT)
BEGIN
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

-- =============================================
-- 7. sp_getStallImage
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getStallImage`$$

CREATE PROCEDURE `sp_getStallImage`(IN `p_stall_id` INT)
BEGIN
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

SELECT '✅ All stall image references in stored procedures have been updated!' as Result;
