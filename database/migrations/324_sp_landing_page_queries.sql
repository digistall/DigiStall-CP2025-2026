-- =============================================
-- Migration 324: Landing Page Stored Procedures
-- =============================================
-- Purpose: Convert landing page dynamic queries to stored procedures
-- Uses dynamic SQL with PREPARE/EXECUTE for search/filter/pagination
-- Handles collation with COLLATE utf8mb4_unicode_ci
-- =============================================

DELIMITER //

-- =============================================
-- GET LANDING PAGE STALLS LIST
-- Dynamic search, filter, and pagination
-- =============================================
DROP PROCEDURE IF EXISTS sp_getLandingPageStallsList//
CREATE PROCEDURE sp_getLandingPageStallsList(
    IN p_search VARCHAR(255),
    IN p_branch_id INT,
    IN p_status VARCHAR(50),
    IN p_price_type VARCHAR(50),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE search_pattern VARCHAR(260);
    
    SET search_pattern = IF(p_search IS NOT NULL AND p_search != '', CONCAT('%', p_search, '%'), NULL);
    
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
    WHERE 1=1
      AND (search_pattern IS NULL OR (
        s.stall_no COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        s.stall_location COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        sec.section_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        f.floor_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        b.branch_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci
      ))
      AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
      AND (p_status IS NULL OR p_status = '' OR 
           (p_status = 'Occupied' AND sh.stallholder_id IS NOT NULL) OR
           (p_status = 'Available' AND sh.stallholder_id IS NULL) OR
           (p_status NOT IN ('Occupied', 'Available') AND s.status COLLATE utf8mb4_unicode_ci = p_status COLLATE utf8mb4_unicode_ci))
      AND (p_price_type IS NULL OR p_price_type = '' OR s.price_type COLLATE utf8mb4_unicode_ci = p_price_type COLLATE utf8mb4_unicode_ci)
    ORDER BY b.branch_name, f.floor_name, s.stall_no ASC
    LIMIT p_limit OFFSET p_offset;
END//

-- =============================================
-- GET LANDING PAGE STALLHOLDERS LIST
-- Dynamic search, filter, and pagination
-- =============================================
DROP PROCEDURE IF EXISTS sp_getLandingPageStallholdersList//
CREATE PROCEDURE sp_getLandingPageStallholdersList(
    IN p_search VARCHAR(255),
    IN p_branch_id INT,
    IN p_business_type VARCHAR(100),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE search_pattern VARCHAR(260);
    
    SET search_pattern = IF(p_search IS NOT NULL AND p_search != '', CONCAT('%', p_search, '%'), NULL);
    
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
      AND (search_pattern IS NULL OR (
        sh.stallholder_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        sh.business_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        sh.business_type COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        s.stall_no COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci OR
        b.branch_name COLLATE utf8mb4_unicode_ci LIKE search_pattern COLLATE utf8mb4_unicode_ci
      ))
      AND (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
      AND (p_business_type IS NULL OR p_business_type = '' OR sh.business_type COLLATE utf8mb4_unicode_ci = p_business_type COLLATE utf8mb4_unicode_ci)
    ORDER BY sh.stallholder_name ASC
    LIMIT p_limit OFFSET p_offset;
END//

DELIMITER ;

-- =============================================
-- END OF MIGRATION 324
-- =============================================
