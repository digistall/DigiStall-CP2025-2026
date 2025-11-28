-- ========================================
-- ADD MISSING AUCTION STORED PROCEDURES
-- Run this script to add the missing procedures
-- ========================================

USE `naga_stall`;

-- ========================================
-- Drop existing procedures if they exist (to avoid errors)
-- ========================================
DROP PROCEDURE IF EXISTS `registerAuctionParticipant`;
DROP PROCEDURE IF EXISTS `updateParticipantBid`;

-- ========================================
-- PROCEDURE 1: Register Auction Participant
-- ========================================
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
    
    -- Insert new participant
    INSERT INTO auction_participants (
        auction_id,
        stall_id,
        applicant_id,
        application_id,
        registration_status,
        registration_date
    ) VALUES (
        p_auction_id,
        p_stall_id,
        p_applicant_id,
        p_application_id,
        'Pre-Registered',
        NOW()
    );
    
    -- Return the newly created participant
    SELECT 
        participant_id,
        auction_id,
        stall_id,
        applicant_id,
        application_id,
        registration_status,
        registration_date,
        current_bid,
        bid_count
    FROM auction_participants
    WHERE participant_id = LAST_INSERT_ID();
    
END$$

DELIMITER ;

-- ========================================
-- PROCEDURE 2: Update Participant Bid
-- ========================================
DELIMITER $$

CREATE PROCEDURE `updateParticipantBid`(
    IN p_participant_id INT,
    IN p_bid_amount DECIMAL(10,2)
)
BEGIN
    DECLARE v_auction_id INT;
    DECLARE v_current_highest DECIMAL(10,2);
    DECLARE v_starting_price DECIMAL(10,2);
    DECLARE v_auction_status VARCHAR(50);
    
    -- Get auction info
    SELECT 
        ap.auction_id,
        a.current_highest_bid,
        a.starting_price,
        a.auction_status
    INTO 
        v_auction_id,
        v_current_highest,
        v_starting_price,
        v_auction_status
    FROM auction_participants ap
    INNER JOIN auction a ON ap.auction_id = a.auction_id
    WHERE ap.participant_id = p_participant_id;
    
    -- Validate auction is active
    IF v_auction_status != 'Active' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Auction is not active';
    END IF;
    
    -- Validate bid amount
    IF p_bid_amount <= IFNULL(v_current_highest, v_starting_price) THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Bid must be higher than current highest bid';
    END IF;
    
    -- Update participant bid
    UPDATE auction_participants
    SET 
        current_bid = p_bid_amount,
        bid_count = bid_count + 1,
        last_bid_time = NOW()
    WHERE participant_id = p_participant_id;
    
    -- Update auction highest bid
    UPDATE auction
    SET 
        current_highest_bid = p_bid_amount,
        highest_bidder_id = (SELECT applicant_id FROM auction_participants WHERE participant_id = p_participant_id),
        total_bids = total_bids + 1
    WHERE auction_id = v_auction_id;
    
    -- Return updated participant
    SELECT 
        participant_id,
        auction_id,
        current_bid,
        bid_count,
        last_bid_time
    FROM auction_participants
    WHERE participant_id = p_participant_id;
    
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
AND ROUTINE_NAME IN ('registerAuctionParticipant', 'updateParticipantBid', 'checkAuctionRegistration', 'getAuctionParticipants')
ORDER BY ROUTINE_NAME;

SELECT '✅ Auction procedures are ready!' as 'Status';
