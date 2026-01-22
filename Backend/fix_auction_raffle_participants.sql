-- =====================================================
-- FIX: Auction/Raffle Participant Tables and Stored Procedures
-- Date: 2026-01-21
-- Purpose: 
-- 1. Add stallholder_id to raffle_participants and auction_participants
-- 2. Update stored procedure to exclude stalls user already owns
-- 3. Fix stallholder-applicant connection
-- =====================================================

DELIMITER $$

-- =====================================================
-- 1. Add stallholder_id column to raffle_participants
-- =====================================================
DROP PROCEDURE IF EXISTS add_stallholder_id_to_raffle_participants$$
CREATE PROCEDURE add_stallholder_id_to_raffle_participants()
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'raffle_participants' 
        AND COLUMN_NAME = 'stallholder_id'
    ) THEN
        ALTER TABLE raffle_participants 
        ADD COLUMN stallholder_id INT NULL AFTER applicant_id,
        ADD CONSTRAINT fk_raffle_participants_stallholder 
        FOREIGN KEY (stallholder_id) REFERENCES stallholder(stallholder_id);
        SELECT 'Added stallholder_id to raffle_participants' as result;
    ELSE
        SELECT 'stallholder_id already exists in raffle_participants' as result;
    END IF;
END$$

CALL add_stallholder_id_to_raffle_participants()$$
DROP PROCEDURE IF EXISTS add_stallholder_id_to_raffle_participants$$

-- =====================================================
-- 2. Add stallholder_id column to auction_participants
-- =====================================================
DROP PROCEDURE IF EXISTS add_stallholder_id_to_auction_participants$$
CREATE PROCEDURE add_stallholder_id_to_auction_participants()
BEGIN
    -- Check if column exists
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() 
        AND TABLE_NAME = 'auction_participants' 
        AND COLUMN_NAME = 'stallholder_id'
    ) THEN
        ALTER TABLE auction_participants 
        ADD COLUMN stallholder_id INT NULL AFTER applicant_id,
        ADD CONSTRAINT fk_auction_participants_stallholder 
        FOREIGN KEY (stallholder_id) REFERENCES stallholder(stallholder_id);
        SELECT 'Added stallholder_id to auction_participants' as result;
    ELSE
        SELECT 'stallholder_id already exists in auction_participants' as result;
    END IF;
END$$

CALL add_stallholder_id_to_auction_participants()$$
DROP PROCEDURE IF EXISTS add_stallholder_id_to_auction_participants$$

-- =====================================================
-- 3. Update stallholder table to ensure mobile_user_id is populated
-- =====================================================
-- The stallholder.mobile_user_id should link to applicant.applicant_id
-- When an applicant becomes a stallholder, this connection must be set

-- Update existing stallholders that have applicant_id but no mobile_user_id
UPDATE stallholder sh
SET sh.mobile_user_id = sh.applicant_id
WHERE sh.applicant_id IS NOT NULL AND sh.mobile_user_id IS NULL;

-- =====================================================
-- 4. Update sp_getAvailableStallsForApplicant to exclude owned stalls
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAvailableStallsForApplicant$$
CREATE PROCEDURE sp_getAvailableStallsForApplicant(
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
        (SELECT image_id FROM stall_images WHERE stall_id = s.stall_id AND is_primary = 1 LIMIT 1) as primary_image_id,
        CASE
            -- Check if user already owns this stall (via stallholder)
            WHEN EXISTS (
                SELECT 1 FROM stallholder sh
                WHERE sh.stall_id = s.stall_id
                AND (sh.mobile_user_id = p_applicant_id OR sh.applicant_id = p_applicant_id)
            ) THEN 'owned'
            -- Check if user has applied for this stall (Fixed Price only)
            WHEN EXISTS (
                SELECT 1 FROM application a
                WHERE a.stall_id = s.stall_id
                AND a.applicant_id = p_applicant_id
                AND a.application_status IN ('Pending', 'Under Review', 'Approved')
            ) THEN 'applied'
            -- Check if user joined raffle for this stall
            WHEN EXISTS (
                SELECT 1 FROM raffle_participants rp
                JOIN raffle r ON rp.raffle_id = r.raffle_id
                WHERE r.stall_id = s.stall_id
                AND (rp.applicant_id = p_applicant_id OR rp.stallholder_id IN (
                    SELECT stallholder_id FROM stallholder WHERE mobile_user_id = p_applicant_id
                ))
            ) THEN 'joined_raffle'
            -- Check if user joined auction for this stall
            WHEN EXISTS (
                SELECT 1 FROM auction_participants ap
                JOIN auction a ON ap.auction_id = a.auction_id
                WHERE a.stall_id = s.stall_id
                AND (ap.applicant_id = p_applicant_id OR ap.stallholder_id IN (
                    SELECT stallholder_id FROM stallholder WHERE mobile_user_id = p_applicant_id
                ))
            ) THEN 'joined_auction'
            ELSE 'available'
        END AS application_status
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    WHERE s.is_available = 1
    AND b.status = 'Active'
    -- EXCLUDE stalls that user already owns
    AND NOT EXISTS (
        SELECT 1 FROM stallholder sh
        WHERE sh.stall_id = s.stall_id
        AND (sh.mobile_user_id = p_applicant_id OR sh.applicant_id = p_applicant_id)
    )
    ORDER BY s.stall_number;
END$$

-- =====================================================
-- 5. Create procedure to get stallholder by applicant_id
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallholderByApplicantId$$
CREATE PROCEDURE sp_getStallholderByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stall_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.status,
        sh.mobile_user_id,
        sh.applicant_id,
        s.stall_number,
        s.stall_location,
        b.branch_name,
        b.branch_id
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE sh.mobile_user_id = p_applicant_id 
       OR sh.applicant_id = p_applicant_id;
END$$

-- =====================================================
-- 6. Create procedure to count stalls owned per branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_countStallsOwnedInBranch$$
CREATE PROCEDURE sp_countStallsOwnedInBranch(
    IN p_applicant_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT COUNT(*) as stalls_owned
    FROM stallholder sh
    JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    WHERE (sh.mobile_user_id = p_applicant_id OR sh.applicant_id = p_applicant_id)
    AND f.branch_id = p_branch_id
    AND sh.status = 'Active';
END$$

DELIMITER ;

-- =====================================================
-- Verify changes
-- =====================================================
SELECT 'Schema updates completed successfully!' as status;

-- Show raffle_participants structure
DESCRIBE raffle_participants;

-- Show auction_participants structure
DESCRIBE auction_participants;
