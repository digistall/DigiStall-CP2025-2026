-- Fix sp_getStallsByTypeForApplicant to include description, floor, and section
-- Using actual stall table columns: stall_number, branch_id, floor_level, section, description
DROP PROCEDURE IF EXISTS `sp_getStallsByTypeForApplicant`;

DELIMITER $$

CREATE PROCEDURE `sp_getStallsByTypeForApplicant`(
    IN p_price_type VARCHAR(50),
    IN p_applicant_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_name,
        s.stall_location,
        s.stall_size,
        s.size,
        s.area_sqm,
        s.monthly_rent,
        s.rental_price,
        s.status AS stall_status,
        s.is_available,
        s.price_type,
        s.description,
        s.floor_level,
        s.section,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.branch_id,
        b.branch_name,
        b.location as area,
        b.status AS branch_status,
        f.floor_name,
        f.floor_number,
        sec.section_name,
        -- Get primary image ID (frontend will fetch image data via API)
        (SELECT image_id FROM stall_images WHERE stall_id = s.stall_id AND is_primary = 1 LIMIT 1) as primary_image_id,
        (SELECT COUNT(*) FROM stall_images WHERE stall_id = s.stall_id) as image_count,
        -- Check if applicant has already applied for this stall
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM application a 
                WHERE a.stall_id = s.stall_id 
                AND a.applicant_id = p_applicant_id
            ) THEN 'applied'
            WHEN EXISTS (
                SELECT 1 FROM raffle_participants rp
                JOIN raffle r ON rp.raffle_id = r.raffle_id
                WHERE r.stall_id = s.stall_id
                AND rp.applicant_id = p_applicant_id
            ) THEN 'joined_raffle'
            WHEN EXISTS (
                SELECT 1 FROM auction_participants ap
                JOIN auction a ON ap.auction_id = a.auction_id
                WHERE a.stall_id = s.stall_id
                AND ap.applicant_id = p_applicant_id
            ) THEN 'joined_auction'
            ELSE 'available'
        END AS application_status
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE s.price_type = p_price_type
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND b.status = 'Active'
    ORDER BY s.stall_number;
END$$

DELIMITER ;

-- Also fix sp_getAvailableStallsForApplicant
DROP PROCEDURE IF EXISTS `sp_getAvailableStallsForApplicant`;

DELIMITER $$

CREATE PROCEDURE `sp_getAvailableStallsForApplicant`(
    IN p_applicant_id INT,
    IN p_area_list TEXT
)
BEGIN
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_name,
        s.stall_location,
        s.stall_size,
        s.size,
        s.area_sqm,
        s.monthly_rent,
        s.rental_price,
        s.status AS stall_status,
        s.is_available,
        s.price_type,
        s.description,
        s.floor_level,
        s.section,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.branch_id,
        b.branch_name,
        b.location as area,
        b.location as location,
        f.floor_name,
        f.floor_number,
        sec.section_name,
        -- Get primary image ID
        (SELECT image_id FROM stall_images WHERE stall_id = s.stall_id AND is_primary = 1 LIMIT 1) as primary_image_id,
        -- Check application status
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM application a 
                WHERE a.stall_id = s.stall_id 
                AND a.applicant_id = p_applicant_id
            ) THEN 'applied'
            WHEN EXISTS (
                SELECT 1 FROM raffle_participants rp
                JOIN raffle r ON rp.raffle_id = r.raffle_id
                WHERE r.stall_id = s.stall_id
                AND rp.applicant_id = p_applicant_id
            ) THEN 'joined_raffle'
            WHEN EXISTS (
                SELECT 1 FROM auction_participants ap
                JOIN auction a ON ap.auction_id = a.auction_id
                WHERE a.stall_id = s.stall_id
                AND ap.applicant_id = p_applicant_id
            ) THEN 'joined_auction'
            ELSE 'available'
        END AS application_status
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE s.is_available = 1
    AND b.status = 'Active'
    ORDER BY s.stall_number;
END$$

DELIMITER ;

SELECT 'Both procedures fixed with correct column names and raffle/auction join status check' as status;
