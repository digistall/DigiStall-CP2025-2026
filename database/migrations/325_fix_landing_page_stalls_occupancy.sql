-- Migration 325: Fix Landing Page Stalls Occupancy Check
-- Purpose: Fix bug where occupied stalls appear on landing page
-- Issue: Stalls with active stallholders but is_available=1 (data inconsistency) 
--        were showing on the landing page
-- Solution: Add explicit check for no active stallholder in addition to is_available=1

DELIMITER //

-- =====================================================
-- SP: sp_getAllStallsForLanding (FIXED)
-- Purpose: Get all TRULY available stalls for landing page
-- Fix: Added LEFT JOIN to stallholder and check for no active stallholder
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllStallsForLanding//
CREATE PROCEDURE sp_getAllStallsForLanding()
BEGIN
    SELECT 
        s.stall_id as id,
        s.stall_no as stallNumber,
        s.stall_location as location,
        s.size as dimensions,
        s.rental_price,
        s.price_type,
        s.status,
        s.description,
        s.stall_image as imageUrl,
        s.is_available as isAvailable,
        sec.section_name as section,
        f.floor_name as floor,
        f.floor_number,
        b.area,
        b.location as branchLocation,
        b.branch_name as branch,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    WHERE s.status = 'Active' AND s.is_available = 1 AND sh.stallholder_id IS NULL
    ORDER BY s.created_at DESC;
END//

-- =====================================================
-- SP: sp_getStallsByAreaOrBranch (FIXED)
-- Purpose: Get stalls by area or branch name for landing page
-- Fix: Added LEFT JOIN to stallholder and check for no active stallholder
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallsByAreaOrBranch//
CREATE PROCEDURE sp_getStallsByAreaOrBranch(
    IN p_filter_type VARCHAR(20),
    IN p_filter_value VARCHAR(255)
)
BEGIN
    IF p_filter_type = 'branch' THEN
        SELECT 
            s.*,
            s.stall_id as id,
            sec.section_name as section,
            f.floor_name as floor,
            f.floor_number,
            b.area,
            b.location as branch_location,
            bm.first_name as manager_first_name,
            bm.last_name as manager_last_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        WHERE b.branch_name = p_filter_value AND s.status = 'Active' AND s.is_available = 1
          AND sh.stallholder_id IS NULL
        ORDER BY s.created_at DESC;
    ELSE
        SELECT 
            s.*,
            s.stall_id as id,
            sec.section_name as section,
            f.floor_name as floor,
            f.floor_number,
            b.area,
            b.location as branch_location,
            bm.first_name as manager_first_name,
            bm.last_name as manager_last_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        WHERE b.area = p_filter_value AND s.status = 'Active' AND s.is_available = 1
          AND sh.stallholder_id IS NULL
        ORDER BY s.created_at DESC;
    END IF;
END//

-- =====================================================
-- SP: sp_getStallsByLocation (FIXED)
-- Purpose: Get stalls by branch location
-- Fix: Added LEFT JOIN to stallholder and check for no active stallholder
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallsByLocation//
CREATE PROCEDURE sp_getStallsByLocation(
    IN p_location VARCHAR(255)
)
BEGIN
    SELECT 
        s.*,
        s.stall_id as id,
        sec.section_name as section,
        f.floor_name as floor,
        f.floor_number,
        b.area,
        b.location as branch_location,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    WHERE b.location = p_location AND s.status = 'Active' AND s.is_available = 1
      AND sh.stallholder_id IS NULL
    ORDER BY s.stall_no, s.created_at DESC;
END//

-- =====================================================
-- SP: sp_getLandingPageStats (FIXED)
-- Purpose: Get accurate statistics for landing page
-- Fix: Use stallholder count for accurate occupied count
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getLandingPageStats//
CREATE PROCEDURE sp_getLandingPageStats()
BEGIN
    DECLARE v_total_stallholders INT DEFAULT 0;
    DECLARE v_total_stalls INT DEFAULT 0;
    DECLARE v_occupied_stalls INT DEFAULT 0;
    DECLARE v_available_stalls INT DEFAULT 0;
    
    -- Count active stallholders
    SELECT COUNT(*) INTO v_total_stallholders
    FROM stallholder WHERE contract_status = 'Active';
    
    -- Count all active stalls
    SELECT COUNT(*) INTO v_total_stalls
    FROM stall WHERE status = 'Active';
    
    -- Count occupied stalls (stalls with active stallholders)
    SELECT COUNT(DISTINCT s.stall_id) INTO v_occupied_stalls
    FROM stall s
    INNER JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    WHERE s.status = 'Active';
    
    -- Count truly available stalls (no active stallholder AND is_available = 1)
    SELECT COUNT(*) INTO v_available_stalls
    FROM stall s
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
    WHERE s.status = 'Active' AND s.is_available = 1 AND sh.stallholder_id IS NULL;
    
    SELECT 
        v_total_stallholders as total_stallholders,
        v_total_stalls as total_stalls,
        v_available_stalls as available_stalls,
        v_occupied_stalls as occupied_stalls;
END//

DELIMITER ;

-- =====================================================
-- SP: sp_getFilteredStalls (FIXED)
-- Purpose: Get stalls with multiple filters for landing page
-- Fix: Added stallholder check to exclude occupied stalls
-- =====================================================
DELIMITER //
DROP PROCEDURE IF EXISTS sp_getFilteredStalls//
CREATE PROCEDURE sp_getFilteredStalls(
    IN p_branch VARCHAR(255),
    IN p_area VARCHAR(255),
    IN p_location VARCHAR(255),
    IN p_section VARCHAR(255),
    IN p_min_price DECIMAL(10,2),
    IN p_max_price DECIMAL(10,2),
    IN p_search VARCHAR(255),
    IN p_sort_by VARCHAR(50),
    IN p_limit INT
)
BEGIN
    SET @sql = 'SELECT 
        s.stall_id as id,
        s.stall_no as stallNumber,
        s.stall_location as location,
        s.size as dimensions,
        s.rental_price,
        s.price_type,
        s.status,
        s.description,
        s.stall_image as imageUrl,
        s.is_available as isAvailable,
        sec.section_name as section,
        f.floor_name as floor,
        f.floor_number,
        b.area,
        b.location as branchLocation,
        b.branch_name as branch,
        b.branch_id as branchId,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
    LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = ''Active''
    WHERE s.status = ''Active'' AND s.is_available = 1 AND sh.stallholder_id IS NULL';

    -- Add branch filter
    IF p_branch IS NOT NULL AND p_branch != '' THEN
        SET @sql = CONCAT(@sql, ' AND b.branch_name = ''', p_branch, '''');
    END IF;

    -- Add area filter (if no branch)
    IF (p_branch IS NULL OR p_branch = '') AND p_area IS NOT NULL AND p_area != '' THEN
        SET @sql = CONCAT(@sql, ' AND b.area = ''', p_area, '''');
    END IF;

    -- Add location filter
    IF p_location IS NOT NULL AND p_location != '' THEN
        SET @sql = CONCAT(@sql, ' AND b.location = ''', p_location, '''');
    END IF;

    -- Add section filter
    IF p_section IS NOT NULL AND p_section != '' THEN
        SET @sql = CONCAT(@sql, ' AND sec.section_name = ''', p_section, '''');
    END IF;

    -- Add price range filters
    IF p_min_price IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.rental_price >= ', p_min_price);
    END IF;

    IF p_max_price IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND s.rental_price <= ', p_max_price);
    END IF;

    -- Add search filter
    IF p_search IS NOT NULL AND p_search != '' THEN
        SET @sql = CONCAT(@sql, ' AND (s.stall_no LIKE ''%', p_search, '%'' OR s.stall_location LIKE ''%', p_search, '%'' OR s.description LIKE ''%', p_search, '%'' OR b.area LIKE ''%', p_search, '%'' OR b.branch_name LIKE ''%', p_search, '%'' OR b.location LIKE ''%', p_search, '%'')');
    END IF;

    -- Add sorting
    IF p_sort_by = 'price_asc' THEN
        SET @sql = CONCAT(@sql, ' ORDER BY s.rental_price ASC');
    ELSEIF p_sort_by = 'price_desc' THEN
        SET @sql = CONCAT(@sql, ' ORDER BY s.rental_price DESC');
    ELSEIF p_sort_by = 'newest' THEN
        SET @sql = CONCAT(@sql, ' ORDER BY s.created_at DESC');
    ELSEIF p_sort_by = 'oldest' THEN
        SET @sql = CONCAT(@sql, ' ORDER BY s.created_at ASC');
    ELSE
        SET @sql = CONCAT(@sql, ' ORDER BY s.created_at DESC');
    END IF;

    -- Add limit
    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', p_limit);
    ELSE
        SET @sql = CONCAT(@sql, ' LIMIT 50');
    END IF;

    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

DELIMITER ;

-- =====================================================
-- DATA FIX: Sync is_available flag with actual stallholder assignments
-- This fixes any data inconsistencies where is_available = 1 but stall has an active stallholder
-- =====================================================
UPDATE stall s
INNER JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
SET s.is_available = 0, s.status = 'Occupied'
WHERE s.is_available = 1;

-- Log the fix
SELECT 
    CONCAT('Fixed ', ROW_COUNT(), ' stalls with data inconsistency (is_available=1 but had active stallholder)') as migration_result;
