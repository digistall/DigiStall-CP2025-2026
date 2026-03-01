-- ============================================
-- Stored Procedure: sp_getStallsByTypeForGeneralApplicant
-- Description: Gets all available stalls by type for general applicants
--              (applicants who registered via landing page without specific stall applications)
-- Created: March 1, 2026
-- ============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_getStallsByTypeForGeneralApplicant$$

CREATE PROCEDURE sp_getStallsByTypeForGeneralApplicant(
    IN p_price_type VARCHAR(50),
    IN p_applicant_id INT
)
BEGIN
    -- Get all available stalls of the specified type
    -- No area restriction for general applicants
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_location,
        s.stall_size,
        s.monthly_rent,
        s.rental_price,
        s.price_type,
        s.description,
        s.floor_level,
        s.section,
        s.is_available,
        s.status,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location,
        f.floor_id,
        f.floor_name,
        sec.section_id,
        sec.section_name,
        -- Check if applicant has already applied to this stall
        CASE 
            WHEN EXISTS (
                SELECT 1 FROM application a 
                WHERE a.stall_id = s.stall_id 
                AND a.applicant_id = p_applicant_id
                AND a.application_status IN ('pending', 'approved')
            ) THEN 'applied'
            WHEN EXISTS (
                SELECT 1 FROM raffle_participants rp
                INNER JOIN raffle r ON rp.raffle_id = r.raffle_id
                WHERE r.stall_id = s.stall_id
                AND rp.applicant_id = p_applicant_id
            ) THEN 'joined_raffle'
            WHEN EXISTS (
                SELECT 1 FROM auction_participants ap
                INNER JOIN auction a ON ap.auction_id = a.auction_id
                WHERE a.stall_id = s.stall_id
                AND ap.applicant_id = p_applicant_id
            ) THEN 'joined_auction'
            ELSE 'available'
        END as application_status
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE s.price_type = p_price_type
      AND s.is_available = 1
      AND s.status = 'Available'
    ORDER BY b.branch_name, s.stall_number;
END$$

DELIMITER ;

-- ============================================
-- Usage Example:
-- CALL sp_getStallsByTypeForGeneralApplicant('Fixed Price', 10);
-- CALL sp_getStallsByTypeForGeneralApplicant('Raffle', 10);
-- CALL sp_getStallsByTypeForGeneralApplicant('Auction', 10);
-- ============================================
