-- =====================================================
-- Stored Procedure: sp_getStallInfoByApplicant
-- Description: Gets stall information for a stallholder
--              by looking up their approved application
-- Author: Auto-generated
-- Date: 2026-03-02
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_getStallInfoByApplicant //

CREATE PROCEDURE sp_getStallInfoByApplicant(
    IN p_applicant_id INT
)
BEGIN
    DECLARE v_count INT DEFAULT 0;
    
    -- First check if stallholder has stall linked directly
    SELECT COUNT(*) INTO v_count
    FROM stallholder s
    LEFT JOIN stall st ON s.stall_id = st.stall_id
    WHERE s.applicant_id = p_applicant_id
      AND s.stall_id IS NOT NULL
      AND st.stall_number IS NOT NULL;
    
    IF v_count > 0 THEN
        -- Get stall info from stallholder table directly
        SELECT 
            s.stallholder_id,
            s.applicant_id,
            s.stall_id,
            COALESCE(st.stall_number, 'N/A') as stall_number,
            COALESCE(st.stall_type, 'Standard') as stall_type,
            COALESCE(st.rental_price, 0) as monthly_rent,
            s.payment_status,
            'stallholder' as source
        FROM stallholder s
        LEFT JOIN stall st ON s.stall_id = st.stall_id
        WHERE s.applicant_id = p_applicant_id
          AND s.stall_id IS NOT NULL
          AND st.stall_number IS NOT NULL
        LIMIT 1;
    ELSE
        -- Fallback: check application table for approved application
        SELECT 
            sh.stallholder_id,
            a.applicant_id,
            a.stall_id,
            COALESCE(st.stall_number, 'N/A') as stall_number,
            COALESCE(st.stall_type, 'Standard') as stall_type,
            COALESCE(st.rental_price, 0) as monthly_rent,
            sh.payment_status,
            'application' as source
        FROM application a
        JOIN stall st ON a.stall_id = st.stall_id
        LEFT JOIN stallholder sh ON sh.applicant_id = a.applicant_id
        WHERE a.applicant_id = p_applicant_id
          AND LOWER(a.application_status) = 'approved'
        ORDER BY a.application_date DESC
        LIMIT 1;
    END IF;
END //

DELIMITER ;

-- =====================================================
-- Usage Example:
-- CALL sp_getStallInfoByApplicant(5);
-- 
-- This will return:
-- - stallholder_id
-- - applicant_id  
-- - stall_id
-- - stall_number
-- - stall_type
-- - monthly_rent
-- - payment_status
-- - source (either 'stallholder' or 'application')
-- =====================================================
