-- ============================================
-- STORED PROCEDURES FOR LANDING PAGE STATISTICS
-- Returns total active stallholders and total stalls
-- For public landing page display
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLandingPageStats`$$

CREATE PROCEDURE `sp_getLandingPageStats`()
BEGIN
    DECLARE v_total_stallholders INT DEFAULT 0;
    DECLARE v_total_stalls INT DEFAULT 0;
    
    -- Count active stallholders (with active contracts)
    SELECT COUNT(*) INTO v_total_stallholders
    FROM stallholder
    WHERE contract_status = 'Active';
    
    -- Count all stalls (regardless of status)
    SELECT COUNT(*) INTO v_total_stalls
    FROM stall;
    
    -- Return the statistics
    SELECT 
        v_total_stallholders AS total_stallholders,
        v_total_stalls AS total_stalls;
END$$

-- ============================================
-- STORED PROCEDURE FOR LANDING PAGE STALLHOLDERS LIST
-- Returns list of active stallholders with details
-- For public landing page display
-- ============================================

DROP PROCEDURE IF EXISTS `sp_getLandingPageStallholders`$$

CREATE PROCEDURE `sp_getLandingPageStallholders`(
    IN p_search VARCHAR(255),
    IN p_branch_filter INT,
    IN p_business_type_filter VARCHAR(100),
    IN p_page INT,
    IN p_limit INT
)
BEGIN
    DECLARE v_offset INT;
    SET v_offset = (p_page - 1) * p_limit;
    
    -- Return stallholders with their stall and branch info
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.business_type,
        sh.contact_number,
        sh.email,
        s.stall_no,
        s.stall_location,
        b.branch_name,
        b.branch_id,
        sh.contract_status,
        sh.compliance_status
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.contract_status = 'Active'
    AND (p_search IS NULL OR p_search = '' OR 
         sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
         sh.business_name LIKE CONCAT('%', p_search, '%') OR
         sh.business_type LIKE CONCAT('%', p_search, '%') OR
         s.stall_no LIKE CONCAT('%', p_search, '%') OR
         b.branch_name LIKE CONCAT('%', p_search, '%'))
    AND (p_branch_filter IS NULL OR p_branch_filter = 0 OR sh.branch_id = p_branch_filter)
    AND (p_business_type_filter IS NULL OR p_business_type_filter = '' OR sh.business_type = p_business_type_filter)
    ORDER BY sh.stallholder_name ASC
    LIMIT p_limit OFFSET v_offset;
END$$

-- ============================================
-- STORED PROCEDURE FOR LANDING PAGE STALLS LIST
-- Returns list of all stalls with details
-- For public landing page display
-- ============================================

DROP PROCEDURE IF EXISTS `sp_getLandingPageStalls`$$

CREATE PROCEDURE `sp_getLandingPageStalls`(
    IN p_search VARCHAR(255),
    IN p_branch_filter INT,
    IN p_status_filter VARCHAR(50),
    IN p_price_type_filter VARCHAR(50),
    IN p_page INT,
    IN p_limit INT
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
        s.stall_image,
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

-- ============================================
-- STORED PROCEDURE FOR GETTING FILTER OPTIONS
-- Returns available branches and business types for filters
-- ============================================

DROP PROCEDURE IF EXISTS `sp_getLandingPageFilterOptions`$$

CREATE PROCEDURE `sp_getLandingPageFilterOptions`()
BEGIN
    -- Return branches
    SELECT branch_id, branch_name FROM branch ORDER BY branch_name;
    
    -- Return distinct business types
    SELECT DISTINCT business_type FROM stallholder WHERE business_type IS NOT NULL AND business_type != '' ORDER BY business_type;
    
    -- Return stall statuses (including occupancy options)
    SELECT 'Active' as status UNION SELECT 'Inactive' UNION SELECT 'Maintenance' UNION SELECT 'Occupied' UNION SELECT 'Available';
    
    -- Return price types
    SELECT 'Fixed Price' as price_type UNION SELECT 'Auction' UNION SELECT 'Raffle';
END$$

DELIMITER ;
