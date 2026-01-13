-- =====================================================
-- MIGRATION: Convert All Raw SQL to Stored Procedures
-- Part 3: Raffle and Auction Management
-- =====================================================

DELIMITER //

-- =====================================================
-- RAFFLE STORED PROCEDURES
-- =====================================================

-- SP: sp_getRaffleById
DROP PROCEDURE IF EXISTS sp_getRaffleById//
CREATE PROCEDURE sp_getRaffleById(
    IN p_raffle_id INT
)
BEGIN
    SELECT 
        r.*,
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        s.status as stall_status,
        b.branch_id,
        b.branch_name
    FROM raffle r
    INNER JOIN stall s ON r.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE r.raffle_id = p_raffle_id;
END//

-- SP: sp_getRaffleByStall
DROP PROCEDURE IF EXISTS sp_getRaffleByStall//
CREATE PROCEDURE sp_getRaffleByStall(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        r.*,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM raffle r
    INNER JOIN stall s ON r.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE r.stall_id = p_stall_id
    ORDER BY r.created_at DESC LIMIT 1;
END//

-- SP: sp_getActiveRaffles
DROP PROCEDURE IF EXISTS sp_getActiveRaffles//
CREATE PROCEDURE sp_getActiveRaffles()
BEGIN
    SELECT 
        r.*,
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_id,
        b.branch_name
    FROM raffle r
    INNER JOIN stall s ON r.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE r.raffle_status = 'Active'
    ORDER BY r.end_time ASC;
END//

-- SP: sp_getExpiredRaffles
DROP PROCEDURE IF EXISTS sp_getExpiredRaffles//
CREATE PROCEDURE sp_getExpiredRaffles()
BEGIN
    SELECT 
        r.*,
        s.stall_id,
        s.stall_no,
        s.stall_location
    FROM raffle r
    INNER JOIN stall s ON r.stall_id = s.stall_id
    WHERE r.raffle_status = 'Active' AND r.end_time <= NOW()
    ORDER BY r.end_time;
END//

-- SP: sp_createRaffle
DROP PROCEDURE IF EXISTS sp_createRaffle//
CREATE PROCEDURE sp_createRaffle(
    IN p_stall_id INT,
    IN p_duration_hours INT,
    IN p_manager_id INT
)
BEGIN
    INSERT INTO raffle (
        stall_id, duration_hours, raffle_status, 
        created_by_manager, start_time, end_time, created_at
    ) VALUES (
        p_stall_id, p_duration_hours, 'Active',
        p_manager_id, NOW(), DATE_ADD(NOW(), INTERVAL p_duration_hours HOUR), NOW()
    );
    
    SELECT LAST_INSERT_ID() as raffle_id;
END//

-- SP: sp_updateRaffleDuration
DROP PROCEDURE IF EXISTS sp_updateRaffleDuration//
CREATE PROCEDURE sp_updateRaffleDuration(
    IN p_raffle_id INT,
    IN p_new_end_time DATETIME,
    IN p_duration_hours INT
)
BEGIN
    UPDATE raffle 
    SET end_time = p_new_end_time, duration_hours = p_duration_hours, updated_at = NOW()
    WHERE raffle_id = p_raffle_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_endRaffle
DROP PROCEDURE IF EXISTS sp_endRaffle//
CREATE PROCEDURE sp_endRaffle(
    IN p_raffle_id INT
)
BEGIN
    UPDATE raffle SET raffle_status = 'Ended', updated_at = NOW() WHERE raffle_id = p_raffle_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_cancelRaffle
DROP PROCEDURE IF EXISTS sp_cancelRaffle//
CREATE PROCEDURE sp_cancelRaffle(
    IN p_raffle_id INT
)
BEGIN
    UPDATE raffle SET raffle_status = 'Cancelled', updated_at = NOW() WHERE raffle_id = p_raffle_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_getRaffleParticipants
DROP PROCEDURE IF EXISTS sp_getRaffleParticipants//
CREATE PROCEDURE sp_getRaffleParticipants(
    IN p_raffle_id INT
)
BEGIN
    SELECT 
        rp.*,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address
    FROM raffle_participants rp
    INNER JOIN applicant a ON rp.applicant_id = a.applicant_id
    WHERE rp.raffle_id = p_raffle_id
    ORDER BY rp.join_time;
END//

-- SP: sp_addRaffleParticipant
DROP PROCEDURE IF EXISTS sp_addRaffleParticipant//
CREATE PROCEDURE sp_addRaffleParticipant(
    IN p_raffle_id INT,
    IN p_applicant_id INT,
    IN p_application_id INT
)
BEGIN
    INSERT INTO raffle_participants (raffle_id, applicant_id, application_id, join_time)
    VALUES (p_raffle_id, p_applicant_id, p_application_id, NOW());
    
    UPDATE raffle SET total_participants = total_participants + 1 WHERE raffle_id = p_raffle_id;
    
    SELECT LAST_INSERT_ID() as participant_id;
END//

-- SP: sp_selectRaffleWinner
DROP PROCEDURE IF EXISTS sp_selectRaffleWinner//
CREATE PROCEDURE sp_selectRaffleWinner(
    IN p_raffle_id INT,
    IN p_winner_applicant_id INT,
    IN p_winner_application_id INT,
    IN p_winning_number INT
)
BEGIN
    UPDATE raffle 
    SET winner_applicant_id = p_winner_applicant_id, 
        raffle_status = 'Ended',
        updated_at = NOW()
    WHERE raffle_id = p_raffle_id;
    
    INSERT INTO raffle_result (
        raffle_id, winner_applicant_id, winner_application_id,
        winning_number, selection_date
    ) VALUES (
        p_raffle_id, p_winner_applicant_id, p_winner_application_id,
        p_winning_number, NOW()
    );
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_logRaffleAction
DROP PROCEDURE IF EXISTS sp_logRaffleAction//
CREATE PROCEDURE sp_logRaffleAction(
    IN p_stall_id INT,
    IN p_raffle_id INT,
    IN p_action_type VARCHAR(100),
    IN p_new_end_time DATETIME,
    IN p_new_duration_hours INT,
    IN p_manager_id INT
)
BEGIN
    INSERT INTO raffle_auction_log (
        stall_id, raffle_id, action_type, new_end_time,
        new_duration_hours, performed_by_manager, action_time
    ) VALUES (
        p_stall_id, p_raffle_id, p_action_type, p_new_end_time,
        p_new_duration_hours, p_manager_id, NOW()
    );
    
    SELECT LAST_INSERT_ID() as log_id;
END//

-- =====================================================
-- AUCTION STORED PROCEDURES
-- =====================================================

-- SP: sp_getAuctionById
DROP PROCEDURE IF EXISTS sp_getAuctionById//
CREATE PROCEDURE sp_getAuctionById(
    IN p_auction_id INT
)
BEGIN
    SELECT 
        a.*,
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        s.status as stall_status,
        b.branch_id,
        b.branch_name
    FROM auction a
    INNER JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.auction_id = p_auction_id;
END//

-- SP: sp_getAuctionByStall
DROP PROCEDURE IF EXISTS sp_getAuctionByStall//
CREATE PROCEDURE sp_getAuctionByStall(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        a.*,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM auction a
    INNER JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.stall_id = p_stall_id
    ORDER BY a.created_at DESC LIMIT 1;
END//

-- SP: sp_getActiveAuctions
DROP PROCEDURE IF EXISTS sp_getActiveAuctions//
CREATE PROCEDURE sp_getActiveAuctions()
BEGIN
    SELECT 
        a.*,
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_id,
        b.branch_name
    FROM auction a
    INNER JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.auction_status = 'Active'
    ORDER BY a.end_time ASC;
END//

-- SP: sp_getExpiredAuctions
DROP PROCEDURE IF EXISTS sp_getExpiredAuctions//
CREATE PROCEDURE sp_getExpiredAuctions()
BEGIN
    SELECT 
        a.*,
        s.stall_id,
        s.stall_no,
        s.stall_location
    FROM auction a
    INNER JOIN stall s ON a.stall_id = s.stall_id
    WHERE a.auction_status = 'Active' AND a.end_time <= NOW()
    ORDER BY a.end_time;
END//

-- SP: sp_createAuction
DROP PROCEDURE IF EXISTS sp_createAuction//
CREATE PROCEDURE sp_createAuction(
    IN p_stall_id INT,
    IN p_starting_price DECIMAL(10,2),
    IN p_duration_hours INT,
    IN p_manager_id INT
)
BEGIN
    INSERT INTO auction (
        stall_id, starting_price, duration_hours, auction_status,
        created_by_manager, start_time, end_time, 
        current_highest_bid, total_bids, created_at
    ) VALUES (
        p_stall_id, p_starting_price, p_duration_hours, 'Active',
        p_manager_id, NOW(), DATE_ADD(NOW(), INTERVAL p_duration_hours HOUR),
        p_starting_price, 0, NOW()
    );
    
    SELECT LAST_INSERT_ID() as auction_id;
END//

-- SP: sp_updateAuctionDuration
DROP PROCEDURE IF EXISTS sp_updateAuctionDuration//
CREATE PROCEDURE sp_updateAuctionDuration(
    IN p_auction_id INT,
    IN p_new_end_time DATETIME,
    IN p_duration_hours INT
)
BEGIN
    UPDATE auction 
    SET end_time = p_new_end_time, duration_hours = p_duration_hours, updated_at = NOW()
    WHERE auction_id = p_auction_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_startAuction
DROP PROCEDURE IF EXISTS sp_startAuction//
CREATE PROCEDURE sp_startAuction(
    IN p_auction_id INT,
    IN p_start_time DATETIME,
    IN p_end_time DATETIME
)
BEGIN
    UPDATE auction 
    SET start_time = p_start_time, end_time = p_end_time, auction_status = 'Active', updated_at = NOW()
    WHERE auction_id = p_auction_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_endAuction
DROP PROCEDURE IF EXISTS sp_endAuction//
CREATE PROCEDURE sp_endAuction(
    IN p_auction_id INT
)
BEGIN
    UPDATE auction SET auction_status = 'Ended', updated_at = NOW() WHERE auction_id = p_auction_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_cancelAuction
DROP PROCEDURE IF EXISTS sp_cancelAuction//
CREATE PROCEDURE sp_cancelAuction(
    IN p_auction_id INT
)
BEGIN
    UPDATE auction SET auction_status = 'Cancelled', updated_at = NOW() WHERE auction_id = p_auction_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_getAuctionBids
DROP PROCEDURE IF EXISTS sp_getAuctionBids//
CREATE PROCEDURE sp_getAuctionBids(
    IN p_auction_id INT
)
BEGIN
    SELECT 
        ab.*,
        a.applicant_full_name,
        a.applicant_contact_number
    FROM auction_bids ab
    INNER JOIN applicant a ON ab.applicant_id = a.applicant_id
    WHERE ab.auction_id = p_auction_id
    ORDER BY ab.bid_amount DESC, ab.bid_time ASC;
END//

-- SP: sp_getHighestBid
DROP PROCEDURE IF EXISTS sp_getHighestBid//
CREATE PROCEDURE sp_getHighestBid(
    IN p_auction_id INT
)
BEGIN
    SELECT 
        ab.*,
        a.applicant_full_name
    FROM auction_bids ab
    INNER JOIN applicant a ON ab.applicant_id = a.applicant_id
    WHERE ab.auction_id = p_auction_id
    ORDER BY ab.bid_amount DESC
    LIMIT 1;
END//

-- SP: sp_placeBid
DROP PROCEDURE IF EXISTS sp_placeBid//
CREATE PROCEDURE sp_placeBid(
    IN p_auction_id INT,
    IN p_applicant_id INT,
    IN p_application_id INT,
    IN p_bid_amount DECIMAL(10,2)
)
BEGIN
    -- Reset previous winning bid
    UPDATE auction_bids SET is_winning_bid = 0 WHERE auction_id = p_auction_id;
    
    -- Insert new bid
    INSERT INTO auction_bids (
        auction_id, applicant_id, application_id, bid_amount, bid_time, is_winning_bid
    ) VALUES (
        p_auction_id, p_applicant_id, p_application_id, p_bid_amount, NOW(), 1
    );
    
    -- Update auction with new highest bid
    UPDATE auction 
    SET current_highest_bid = p_bid_amount, 
        current_highest_bidder = p_applicant_id,
        total_bids = total_bids + 1,
        updated_at = NOW()
    WHERE auction_id = p_auction_id;
    
    SELECT LAST_INSERT_ID() as bid_id;
END//

-- SP: sp_getBidCount
DROP PROCEDURE IF EXISTS sp_getBidCount//
CREATE PROCEDURE sp_getBidCount(
    IN p_auction_id INT
)
BEGIN
    SELECT COUNT(*) as bid_count FROM auction_bids WHERE auction_id = p_auction_id;
END//

-- SP: sp_getUniqueBidders
DROP PROCEDURE IF EXISTS sp_getUniqueBidders//
CREATE PROCEDURE sp_getUniqueBidders(
    IN p_auction_id INT
)
BEGIN
    SELECT COUNT(DISTINCT applicant_id) as bidder_count FROM auction_bids WHERE auction_id = p_auction_id;
END//

-- SP: sp_selectAuctionWinner
DROP PROCEDURE IF EXISTS sp_selectAuctionWinner//
CREATE PROCEDURE sp_selectAuctionWinner(
    IN p_auction_id INT,
    IN p_winner_applicant_id INT,
    IN p_winner_bid_id INT,
    IN p_winning_amount DECIMAL(10,2)
)
BEGIN
    UPDATE auction 
    SET winner_applicant_id = p_winner_applicant_id,
        winner_bid_id = p_winner_bid_id,
        auction_status = 'Ended',
        updated_at = NOW()
    WHERE auction_id = p_auction_id;
    
    INSERT INTO auction_result (
        auction_id, winner_applicant_id, winning_amount, selection_date
    ) VALUES (
        p_auction_id, p_winner_applicant_id, p_winning_amount, NOW()
    );
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_logAuctionAction
DROP PROCEDURE IF EXISTS sp_logAuctionAction//
CREATE PROCEDURE sp_logAuctionAction(
    IN p_stall_id INT,
    IN p_auction_id INT,
    IN p_action_type VARCHAR(100),
    IN p_new_end_time DATETIME,
    IN p_new_duration_hours INT,
    IN p_manager_id INT
)
BEGIN
    INSERT INTO raffle_auction_log (
        stall_id, auction_id, action_type, new_end_time,
        new_duration_hours, performed_by_manager, action_time
    ) VALUES (
        p_stall_id, p_auction_id, p_action_type, p_new_end_time,
        p_new_duration_hours, p_manager_id, NOW()
    );
    
    SELECT LAST_INSERT_ID() as log_id;
END//

-- =====================================================
-- LIVE STALL DATA STORED PROCEDURES
-- =====================================================

-- SP: sp_getLiveStallData
DROP PROCEDURE IF EXISTS sp_getLiveStallData//
CREATE PROCEDURE sp_getLiveStallData(
    IN p_stall_id INT
)
BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location,
        r.raffle_id,
        r.raffle_status,
        r.start_time as raffle_start,
        r.end_time as raffle_end,
        r.total_participants,
        a.auction_id,
        a.auction_status,
        a.start_time as auction_start,
        a.end_time as auction_end,
        a.starting_price,
        a.current_highest_bid,
        a.total_bids
    FROM stall s
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN raffle r ON s.stall_id = r.stall_id AND r.raffle_status = 'Active'
    LEFT JOIN auction a ON s.stall_id = a.stall_id AND a.auction_status = 'Active'
    WHERE s.stall_id = p_stall_id;
END//

-- SP: sp_activateAuction
DROP PROCEDURE IF EXISTS sp_activateAuction//
CREATE PROCEDURE sp_activateAuction(
    IN p_auction_id INT
)
BEGIN
    UPDATE auction 
    SET auction_status = 'Active', start_time = NOW(), updated_at = NOW()
    WHERE auction_id = p_auction_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

SELECT 'Part 3 Migration Complete - Raffle & Auction SPs created!' as status;
