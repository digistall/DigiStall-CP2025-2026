-- Fix sp_getStallsByTypeForApplicant to use correct column names
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
        s.stall_location,
        s.size AS stall_size,
        s.monthly_rent,
        s.status AS stall_status,
        s.is_available,
        s.price_type,
        s.raffle_auction_deadline,  -- FIXED: was raffle_auction_start_time
        s.raffle_auction_status,
        s.branch_id,
        b.branch_name,
        b.area,
        b.status AS branch_status,
        -- Get primary image or first image
        (SELECT image_url FROM stall_images WHERE stall_id = s.stall_id AND is_primary = 1 LIMIT 1) as primary_image,
        (SELECT COUNT(*) FROM stall_images WHERE stall_id = s.stall_id) as image_count,
        -- Check if applicant has already applied for this stall
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM application a 
                WHERE a.stall_id = s.stall_id 
                AND a.applicant_id = p_applicant_id
            ) THEN 'applied'
            ELSE 'available'
        END AS application_status
    FROM stall s
    INNER JOIN branch b ON s.branch_id = b.branch_id
    WHERE s.price_type = p_price_type
    AND (p_branch_id IS NULL OR s.branch_id = p_branch_id)
    AND b.status = 'Active'
    ORDER BY s.stall_number;
END$$

DELIMITER ;

SELECT 'sp_getStallsByTypeForApplicant fixed - using raffle_auction_deadline instead of raffle_auction_start_time' as status;
