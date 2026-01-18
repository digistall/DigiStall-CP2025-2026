-- Comprehensive fix for all mobile issues
-- 1. Fix stall column references (stall_number instead of stall_no)
-- 2. Fix stall images (use stall_images table, not stall_image column)
-- 3. Update stored procedures

USE naga_stall;

-- ============================================
-- Fix sp_getStallsByTypeForApplicant procedure
-- Remove reference to non-existent stall_image column
-- Add proper stall_images table join
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getStallsByTypeForApplicant`;

DELIMITER $$

CREATE PROCEDURE `sp_getStallsByTypeForApplicant`(
    IN p_price_type VARCHAR(50),
    IN p_applicant_id INT,
    IN p_stall_id INT
)
BEGIN
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_location,
        s.stall_size,
        s.size,
        s.area_sqm,
        s.monthly_rent,
        s.rental_price,
        s.base_rate,
        s.rate_per_sqm,
        s.price_type,
        s.status,
        s.description,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.raffle_auction_start_time,
        s.raffle_auction_end_time,
        -- Branch information
        b.branch_id,
        b.branch_name,
        b.area,
        b.status as branch_status,
        -- Floor and Section info
        f.floor_id,
        f.floor_name,
        sec.section_id,
        sec.section_name,
        -- Application status
        CASE 
            WHEN app.application_id IS NOT NULL THEN 'applied'
            WHEN s.is_available = 1 AND s.status = 'Available' THEN 'available'
            ELSE 'unavailable'
        END as application_status,
        -- Get primary image from stall_images table
        (SELECT image_url FROM stall_images WHERE stall_id = s.stall_id AND is_primary = 1 LIMIT 1) as primary_image,
        -- Count total images
        (SELECT COUNT(*) FROM stall_images WHERE stall_id = s.stall_id) as image_count
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN application app ON s.stall_id = app.stall_id AND app.applicant_id = p_applicant_id
    WHERE s.price_type = p_price_type
      AND b.status = 'Active'
      AND (p_stall_id IS NULL OR s.stall_id = p_stall_id)
    ORDER BY b.area, b.branch_name, s.stall_number;
END$$

DELIMITER ;

-- ============================================
-- Fix sp_getFullStallholderInfo procedure
-- Update to use stall_number instead of stall_no
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getFullStallholderInfo`;

DELIMITER $$

CREATE PROCEDURE `sp_getFullStallholderInfo`(IN p_applicant_id INT)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.branch_id,
        b.branch_name,
        sh.stall_id,
        s.stall_number,
        s.stall_location,
        s.size,
        sh.contract_start_date,
        sh.contract_status,
        sh.monthly_rent,
        sh.payment_status
    FROM stallholder sh
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    INNER JOIN stall s ON sh.stall_id = s.stall_id
    WHERE sh.applicant_id = p_applicant_id
    LIMIT 1;
END$$

DELIMITER ;

-- ============================================
-- Verify procedures were created successfully
-- ============================================
SELECT 'sp_getStallsByTypeForApplicant created successfully' as status;
SELECT 'sp_getFullStallholderInfo created successfully' as status;
SELECT 'All procedures updated successfully' as final_status;
