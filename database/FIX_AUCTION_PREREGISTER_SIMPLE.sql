-- ========================================
-- SIMPLIFIED AUCTION PRE-REGISTRATION
-- For tracking pre-registrations only (no bidding)
-- ========================================

USE `naga_stall`;

-- ========================================
-- Drop and recreate the procedure
-- ========================================
DROP PROCEDURE IF EXISTS `registerAuctionParticipant`;

DELIMITER $$

CREATE PROCEDURE `registerAuctionParticipant`(
    IN p_auction_id INT,
    IN p_stall_id INT,
    IN p_applicant_id INT,
    IN p_application_id INT
)
BEGIN
    DECLARE v_auction_status VARCHAR(50);
    DECLARE v_participant_count INT;
    
    -- Check if auction exists and get its status
    SELECT auction_status INTO v_auction_status
    FROM auction
    WHERE auction_id = p_auction_id;
    
    -- Validate auction exists
    IF v_auction_status IS NULL THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Auction not found';
    END IF;
    
    -- Validate auction is accepting registrations
    IF v_auction_status IN ('Ended', 'Cancelled') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'This auction is not accepting registrations';
    END IF;
    
    -- Check if applicant is already registered
    SELECT COUNT(*) INTO v_participant_count
    FROM auction_participants
    WHERE auction_id = p_auction_id AND applicant_id = p_applicant_id;
    
    IF v_participant_count > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Applicant is already registered for this auction';
    END IF;
    
    -- Insert new participant (simple pre-registration only)
    INSERT INTO auction_participants (
        auction_id,
        stall_id,
        applicant_id,
        application_id
    ) VALUES (
        p_auction_id,
        p_stall_id,
        p_applicant_id,
        p_application_id
    );
    
    -- Return the newly created participant with only existing columns
    SELECT 
        participant_id,
        auction_id,
        stall_id,
        applicant_id,
        application_id,
        created_at as registration_date,
        'Pre-Registered' as registration_status
    FROM auction_participants
    WHERE participant_id = LAST_INSERT_ID();
    
END$$

DELIMITER ;

-- ========================================
-- VERIFICATION
-- ========================================
SELECT 
    ROUTINE_NAME as 'Procedure Name',
    CREATED as 'Created At'
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'naga_stall'
AND ROUTINE_TYPE = 'PROCEDURE'
AND ROUTINE_NAME = 'registerAuctionParticipant';

SELECT '✅ Simplified auction pre-registration procedure is ready!' as 'Status';
