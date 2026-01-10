-- =============================================
-- 411: Raffle and Auction Management Stored Procedures
-- Created: Auto-generated for 100% SP compliance
-- =============================================

DELIMITER $$

-- =============================================
-- Insert raffle entry
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertRaffleEntry$$
CREATE PROCEDURE sp_insertRaffleEntry(
  IN p_raffle_id INT,
  IN p_applicant_id INT
)
BEGIN
  INSERT INTO raffle_entries (raffle_id, applicant_id, entry_date)
  VALUES (p_raffle_id, p_applicant_id, NOW());
  SELECT LAST_INSERT_ID() as entry_id;
END$$

-- =============================================
-- Insert auction bid
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertAuctionBid$$
CREATE PROCEDURE sp_insertAuctionBid(
  IN p_auction_id INT,
  IN p_applicant_id INT,
  IN p_bid_amount DECIMAL(10,2)
)
BEGIN
  INSERT INTO auction_bids (auction_id, applicant_id, bid_amount, bid_time)
  VALUES (p_auction_id, p_applicant_id, p_bid_amount, NOW());
  SELECT LAST_INSERT_ID() as bid_id;
END$$

-- =============================================
-- Update auction current bid
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateAuctionCurrentBid$$
CREATE PROCEDURE sp_updateAuctionCurrentBid(
  IN p_auction_id INT,
  IN p_current_bid DECIMAL(10,2)
)
BEGIN
  UPDATE auction 
  SET current_bid = p_current_bid
  WHERE auction_id = p_auction_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get raffle entries by raffle ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getRaffleEntries$$
CREATE PROCEDURE sp_getRaffleEntries(
  IN p_raffle_id INT
)
BEGIN
  SELECT 
    re.entry_id,
    re.raffle_id,
    re.applicant_id,
    re.entry_date,
    a.applicant_full_name,
    a.applicant_email,
    a.applicant_contact_number
  FROM raffle_entries re
  LEFT JOIN applicant a ON re.applicant_id = a.applicant_id
  WHERE re.raffle_id = p_raffle_id
  ORDER BY re.entry_date;
END$$

-- =============================================
-- Get auction bids by auction ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAuctionBids$$
CREATE PROCEDURE sp_getAuctionBids(
  IN p_auction_id INT
)
BEGIN
  SELECT 
    ab.bid_id,
    ab.auction_id,
    ab.applicant_id,
    ab.bid_amount,
    ab.bid_time,
    a.applicant_full_name,
    a.applicant_email,
    a.applicant_contact_number
  FROM auction_bids ab
  LEFT JOIN applicant a ON ab.applicant_id = a.applicant_id
  WHERE ab.auction_id = p_auction_id
  ORDER BY ab.bid_amount DESC;
END$$

-- =============================================
-- Insert raffle result
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertRaffleResult$$
CREATE PROCEDURE sp_insertRaffleResult(
  IN p_raffle_id INT,
  IN p_winner_applicant_id INT,
  IN p_stall_id INT
)
BEGIN
  INSERT INTO raffle_result (raffle_id, winner_applicant_id, stall_id, result_date)
  VALUES (p_raffle_id, p_winner_applicant_id, p_stall_id, NOW());
  SELECT LAST_INSERT_ID() as result_id;
END$$

-- =============================================
-- Insert auction result
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertAuctionResult$$
CREATE PROCEDURE sp_insertAuctionResult(
  IN p_auction_id INT,
  IN p_winner_applicant_id INT,
  IN p_stall_id INT,
  IN p_winning_bid DECIMAL(10,2)
)
BEGIN
  INSERT INTO auction_result (auction_id, winner_applicant_id, stall_id, winning_bid, result_date)
  VALUES (p_auction_id, p_winner_applicant_id, p_stall_id, p_winning_bid, NOW());
  SELECT LAST_INSERT_ID() as result_id;
END$$

-- =============================================
-- Insert raffle auction log
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertRaffleAuctionLog$$
CREATE PROCEDURE sp_insertRaffleAuctionLog(
  IN p_stall_id INT,
  IN p_type ENUM('raffle', 'auction'),
  IN p_raffle_id INT,
  IN p_auction_id INT,
  IN p_winner_applicant_id INT,
  IN p_action VARCHAR(100),
  IN p_details TEXT
)
BEGIN
  INSERT INTO raffle_auction_log (
    stall_id,
    type,
    raffle_id,
    auction_id,
    winner_applicant_id,
    action,
    details,
    log_date
  ) VALUES (
    p_stall_id,
    p_type,
    p_raffle_id,
    p_auction_id,
    p_winner_applicant_id,
    p_action,
    p_details,
    NOW()
  );
  SELECT LAST_INSERT_ID() as log_id;
END$$

-- =============================================
-- Update raffle status
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateRaffleStatus$$
CREATE PROCEDURE sp_updateRaffleStatus(
  IN p_raffle_id INT,
  IN p_status VARCHAR(50)
)
BEGIN
  UPDATE raffle 
  SET status = p_status
  WHERE raffle_id = p_raffle_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Update auction status
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateAuctionStatus$$
CREATE PROCEDURE sp_updateAuctionStatus(
  IN p_auction_id INT,
  IN p_status VARCHAR(50)
)
BEGIN
  UPDATE auction 
  SET status = p_status
  WHERE auction_id = p_auction_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get raffle by stall ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getRaffleByStallId$$
CREATE PROCEDURE sp_getRaffleByStallId(
  IN p_stall_id INT
)
BEGIN
  SELECT 
    r.*,
    s.stall_no,
    s.stall_location,
    s.rental_price
  FROM raffle r
  LEFT JOIN stall s ON r.stall_id = s.stall_id
  WHERE r.stall_id = p_stall_id;
END$$

-- =============================================
-- Get auction by stall ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAuctionByStallId$$
CREATE PROCEDURE sp_getAuctionByStallId(
  IN p_stall_id INT
)
BEGIN
  SELECT 
    a.*,
    s.stall_no,
    s.stall_location,
    s.rental_price
  FROM auction a
  LEFT JOIN stall s ON a.stall_id = s.stall_id
  WHERE a.stall_id = p_stall_id;
END$$

-- =============================================
-- Get active raffles
-- =============================================
DROP PROCEDURE IF EXISTS sp_getActiveRaffles$$
CREATE PROCEDURE sp_getActiveRaffles()
BEGIN
  SELECT 
    r.*,
    s.stall_no,
    s.stall_location,
    s.rental_price,
    b.branch_name,
    b.area,
    (SELECT COUNT(*) FROM raffle_entries re WHERE re.raffle_id = r.raffle_id) as entry_count
  FROM raffle r
  LEFT JOIN stall s ON r.stall_id = s.stall_id
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE r.status = 'open'
  ORDER BY r.raffle_deadline;
END$$

-- =============================================
-- Get active auctions
-- =============================================
DROP PROCEDURE IF EXISTS sp_getActiveAuctions$$
CREATE PROCEDURE sp_getActiveAuctions()
BEGIN
  SELECT 
    a.*,
    s.stall_no,
    s.stall_location,
    s.rental_price,
    b.branch_name,
    b.area,
    (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as bid_count,
    (SELECT MAX(bid_amount) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as highest_bid
  FROM auction a
  LEFT JOIN stall s ON a.stall_id = s.stall_id
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE a.status = 'open'
  ORDER BY a.auction_deadline;
END$$

-- =============================================
-- Get raffle with entries count
-- =============================================
DROP PROCEDURE IF EXISTS sp_getRaffleWithEntriesCount$$
CREATE PROCEDURE sp_getRaffleWithEntriesCount(
  IN p_raffle_id INT
)
BEGIN
  SELECT 
    r.*,
    s.stall_no,
    s.stall_location,
    s.rental_price,
    b.branch_name,
    b.area,
    (SELECT COUNT(*) FROM raffle_entries re WHERE re.raffle_id = r.raffle_id) as entry_count
  FROM raffle r
  LEFT JOIN stall s ON r.stall_id = s.stall_id
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE r.raffle_id = p_raffle_id;
END$$

-- =============================================
-- Get auction with bids info
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAuctionWithBidsInfo$$
CREATE PROCEDURE sp_getAuctionWithBidsInfo(
  IN p_auction_id INT
)
BEGIN
  SELECT 
    a.*,
    s.stall_no,
    s.stall_location,
    s.rental_price,
    b.branch_name,
    b.area,
    (SELECT COUNT(*) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as bid_count,
    (SELECT MAX(bid_amount) FROM auction_bids ab WHERE ab.auction_id = a.auction_id) as highest_bid
  FROM auction a
  LEFT JOIN stall s ON a.stall_id = s.stall_id
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  WHERE a.auction_id = p_auction_id;
END$$

-- =============================================
-- Check if applicant already entered raffle
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkRaffleEntry$$
CREATE PROCEDURE sp_checkRaffleEntry(
  IN p_raffle_id INT,
  IN p_applicant_id INT
)
BEGIN
  SELECT entry_id 
  FROM raffle_entries
  WHERE raffle_id = p_raffle_id AND applicant_id = p_applicant_id;
END$$

-- =============================================
-- Check if applicant has bid in auction
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkAuctionBid$$
CREATE PROCEDURE sp_checkAuctionBid(
  IN p_auction_id INT,
  IN p_applicant_id INT
)
BEGIN
  SELECT bid_id, bid_amount
  FROM auction_bids
  WHERE auction_id = p_auction_id AND applicant_id = p_applicant_id
  ORDER BY bid_amount DESC
  LIMIT 1;
END$$

-- =============================================
-- Get raffle result
-- =============================================
DROP PROCEDURE IF EXISTS sp_getRaffleResult$$
CREATE PROCEDURE sp_getRaffleResult(
  IN p_raffle_id INT
)
BEGIN
  SELECT 
    rr.*,
    a.applicant_full_name as winner_name,
    a.applicant_email as winner_email,
    s.stall_no
  FROM raffle_result rr
  LEFT JOIN applicant a ON rr.winner_applicant_id = a.applicant_id
  LEFT JOIN stall s ON rr.stall_id = s.stall_id
  WHERE rr.raffle_id = p_raffle_id;
END$$

-- =============================================
-- Get auction result
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAuctionResult$$
CREATE PROCEDURE sp_getAuctionResult(
  IN p_auction_id INT
)
BEGIN
  SELECT 
    ar.*,
    a.applicant_full_name as winner_name,
    a.applicant_email as winner_email,
    s.stall_no
  FROM auction_result ar
  LEFT JOIN applicant a ON ar.winner_applicant_id = a.applicant_id
  LEFT JOIN stall s ON ar.stall_id = s.stall_id
  WHERE ar.auction_id = p_auction_id;
END$$

-- =============================================
-- Get stall by stall_no with branch
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallByStallNo$$
CREATE PROCEDURE sp_getStallByStallNo(
  IN p_stall_no VARCHAR(50),
  IN p_branch_id INT
)
BEGIN
  SELECT 
    s.stall_id,
    s.stall_no,
    s.stall_location,
    s.size,
    s.rental_price,
    s.status,
    s.is_available,
    f.branch_id
  FROM stall s
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  WHERE s.stall_no = p_stall_no
    AND f.branch_id = p_branch_id;
END$$

-- =============================================
-- Get stall images
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallImages$$
CREATE PROCEDURE sp_getStallImages(
  IN p_stall_id INT
)
BEGIN
  SELECT image_id, stall_id, image_url, image_order, created_at
  FROM stall_images
  WHERE stall_id = p_stall_id
  ORDER BY image_order;
END$$

-- =============================================
-- Insert stall image
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertStallImage$$
CREATE PROCEDURE sp_insertStallImage(
  IN p_stall_id INT,
  IN p_image_url TEXT,
  IN p_image_order INT
)
BEGIN
  INSERT INTO stall_images (stall_id, image_url, image_order, created_at)
  VALUES (p_stall_id, p_image_url, COALESCE(p_image_order, 0), NOW());
  SELECT LAST_INSERT_ID() as image_id;
END$$

-- =============================================
-- Delete stall image
-- =============================================
DROP PROCEDURE IF EXISTS sp_deleteStallImage$$
CREATE PROCEDURE sp_deleteStallImage(
  IN p_image_id INT
)
BEGIN
  DELETE FROM stall_images WHERE image_id = p_image_id;
  SELECT ROW_COUNT() as affected_rows;
END$$

-- =============================================
-- Get live stall info for raffle/auction
-- =============================================
DROP PROCEDURE IF EXISTS sp_getLiveStallInfo$$
CREATE PROCEDURE sp_getLiveStallInfo(
  IN p_stall_id INT
)
BEGIN
  SELECT 
    s.stall_id,
    s.stall_no,
    s.stall_location,
    s.size,
    s.rental_price,
    s.price_type,
    s.deadline,
    s.status,
    s.is_available,
    s.description,
    s.stall_image,
    f.floor_name,
    sec.section_name,
    b.branch_name,
    b.area,
    r.raffle_id,
    r.raffle_deadline,
    r.status as raffle_status,
    a.auction_id,
    a.auction_deadline,
    a.starting_price,
    a.current_bid,
    a.status as auction_status
  FROM stall s
  LEFT JOIN section sec ON s.section_id = sec.section_id
  LEFT JOIN floor f ON sec.floor_id = f.floor_id
  LEFT JOIN branch b ON f.branch_id = b.branch_id
  LEFT JOIN raffle r ON s.stall_id = r.stall_id AND r.status = 'open'
  LEFT JOIN auction a ON s.stall_id = a.stall_id AND a.status = 'open'
  WHERE s.stall_id = p_stall_id;
END$$

DELIMITER ;

-- Success message
SELECT 'Raffle and Auction Management stored procedures created successfully' as status;
