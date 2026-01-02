-- Migration 316: Landing Page Stalls Stored Procedures
-- This creates stored procedures for public landing page stall queries

DELIMITER //

-- =====================================================
-- SP: sp_getAllStallsForLanding
-- Purpose: Get all available stalls for landing page
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
    WHERE s.status = 'Active' AND s.is_available = 1
    ORDER BY s.created_at DESC;
END//

-- =====================================================
-- SP: sp_getStallByIdForLanding
-- Purpose: Get single stall by ID for landing page
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallByIdForLanding//
CREATE PROCEDURE sp_getStallByIdForLanding(
    IN p_stall_id INT
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
    WHERE s.stall_id = p_stall_id AND s.status = 'Active' AND s.is_available = 1;
END//

-- =====================================================
-- SP: sp_getAvailableAreas
-- Purpose: Get distinct available areas
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAvailableAreas//
CREATE PROCEDURE sp_getAvailableAreas()
BEGIN
    SELECT DISTINCT area 
    FROM branch 
    WHERE status = 'Active' 
    ORDER BY area;
END//

-- =====================================================
-- SP: sp_getBranches
-- Purpose: Get distinct branch names
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranches//
CREATE PROCEDURE sp_getBranches()
BEGIN
    SELECT DISTINCT branch_name as branch 
    FROM branch 
    WHERE status = 'Active' 
    ORDER BY branch_name;
END//

-- =====================================================
-- SP: sp_getLocationsByArea
-- Purpose: Get locations by area or branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getLocationsByArea//
CREATE PROCEDURE sp_getLocationsByArea(
    IN p_filter_value VARCHAR(255),
    IN p_filter_by_branch BOOLEAN
)
BEGIN
    IF p_filter_by_branch THEN
        SELECT DISTINCT location, branch_name as branch 
        FROM branch 
        WHERE branch_name = p_filter_value AND status = 'Active' 
        ORDER BY location;
    ELSE
        SELECT DISTINCT location, branch_name as branch 
        FROM branch 
        WHERE area = p_filter_value AND status = 'Active' 
        ORDER BY location;
    END IF;
END//

-- =====================================================
-- SP: sp_getStallsByAreaOrBranch
-- Purpose: Get stalls filtered by area or branch name
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallsByAreaOrBranch//
CREATE PROCEDURE sp_getStallsByAreaOrBranch(
    IN p_filter_value VARCHAR(255),
    IN p_filter_by_branch BOOLEAN
)
BEGIN
    IF p_filter_by_branch THEN
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
            b.branch_id as branchId,
            bm.first_name as manager_first_name,
            bm.last_name as manager_last_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
        WHERE b.branch_name = p_filter_value AND s.status = 'Active' AND s.is_available = 1
        ORDER BY s.created_at DESC;
    ELSE
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
            b.branch_id as branchId,
            bm.first_name as manager_first_name,
            bm.last_name as manager_last_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON sec.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id
        WHERE b.area = p_filter_value AND s.status = 'Active' AND s.is_available = 1
        ORDER BY s.created_at DESC;
    END IF;
END//

-- =====================================================
-- SP: sp_getStallsByLocation
-- Purpose: Get stalls by branch location
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
    WHERE b.location = p_location AND s.status = 'Active' AND s.is_available = 1
    ORDER BY s.stall_no, s.created_at DESC;
END//

-- =====================================================
-- SP: sp_getLandingPageStats
-- Purpose: Get statistics for landing page
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getLandingPageStats//
CREATE PROCEDURE sp_getLandingPageStats()
BEGIN
    SELECT 
        (SELECT COUNT(*) FROM stallholder WHERE contract_status = 'Active') as total_stallholders,
        (SELECT COUNT(*) FROM stall) as total_stalls,
        (SELECT COUNT(*) FROM stall WHERE is_available = 1) as available_stalls,
        (SELECT COUNT(*) FROM stall WHERE is_available = 0) as occupied_stalls;
END//

-- =====================================================
-- SP: sp_getAvailableMarkets
-- Purpose: Get available markets with stall counts
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAvailableMarkets//
CREATE PROCEDURE sp_getAvailableMarkets()
BEGIN
    SELECT 
        b.area,
        b.location,
        COUNT(s.stall_id) as total_stalls,
        SUM(CASE WHEN s.is_available = 1 THEN 1 ELSE 0 END) as available_stalls,
        MIN(s.rental_price) as min_price,
        MAX(s.rental_price) as max_price,
        AVG(s.rental_price) as avg_price
    FROM branch b
    LEFT JOIN floor f ON b.branch_id = f.branch_id
    LEFT JOIN section sec ON f.floor_id = sec.floor_id
    LEFT JOIN stall s ON sec.section_id = s.section_id AND s.status = 'Active'
    WHERE b.status = 'Active'
    GROUP BY b.area, b.location, b.branch_id
    HAVING total_stalls > 0
    ORDER BY b.area, b.location;
END//

-- =====================================================
-- SP: sp_getFilteredStalls
-- Purpose: Get stalls with multiple filters for landing page
-- =====================================================
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
    WHERE s.status = ''Active'' AND s.is_available = 1';

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

-- Success message
SELECT 'Landing Page Stalls stored procedures created successfully' as status;
