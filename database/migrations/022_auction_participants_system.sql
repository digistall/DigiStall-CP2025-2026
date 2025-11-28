-- ========================================
-- MIGRATION 022: AUCTION PARTICIPANTS SYSTEM
-- Description: Create auction_participants table and stored procedures
-- for handling auction pre-registration
-- ========================================

USE `naga_stall`;

-- Create auction_participants table (replaces auction_bids concept for pre-registration)
CREATE TABLE IF NOT EXISTS `auction_participants` (
  `participant_id` INT(11) NOT NULL AUTO_INCREMENT,
  `auction_id` INT(11) NOT NULL,
  `stall_id` INT(11) NOT NULL,
  `applicant_id` INT(11) NOT NULL,
  `application_id` INT(11) DEFAULT NULL,
  `registration_date` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `registration_status` ENUM('Pre-Registered', 'Participated', 'Won', 'Lost', 'Cancelled') DEFAULT 'Pre-Registered',
  `bid_amount` DECIMAL(10,2) DEFAULT NULL COMMENT 'Actual bid amount if participant bids during auction',
  `bid_time` DATETIME DEFAULT NULL COMMENT 'Time when actual bid was placed',
  `is_winning_bid` TINYINT(1) DEFAULT 0,
  `notes` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP(),
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP() ON UPDATE CURRENT_TIMESTAMP(),
  PRIMARY KEY (`participant_id`),
  UNIQUE KEY `unique_participant_per_auction` (`auction_id`, `applicant_id`),
  KEY `idx_auction_id` (`auction_id`),
  KEY `idx_stall_id` (`stall_id`),
  KEY `idx_applicant_id` (`applicant_id`),
  KEY `idx_application_id` (`application_id`),
  KEY `idx_registration_status` (`registration_status`),
  CONSTRAINT `fk_auction_participant_auction` FOREIGN KEY (`auction_id`) REFERENCES `auction` (`auction_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_auction_participant_stall` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_auction_participant_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_auction_participant_application` FOREIGN KEY (`application_id`) REFERENCES `application` (`application_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Stores auction pre-registration and participation records';

-- ========================================
-- STORED PROCEDURE: Register participant for auction
-- ========================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `registerAuctionParticipant`$$

CREATE PROCEDURE `registerAuctionParticipant`(
    IN p_auction_id INT,
    IN p_stall_id INT,
    IN p_applicant_id INT,
    IN p_application_id INT
)
BEGIN
    DECLARE v_participant_id INT;
    DECLARE v_auction_exists INT DEFAULT 0;
    DECLARE v_already_registered INT DEFAULT 0;
    DECLARE v_auction_status VARCHAR(50);
    DECLARE v_stall_no VARCHAR(20);
    DECLARE v_applicant_name VARCHAR(255);
    
    -- Check if auction exists and get status
    SELECT COUNT(*), MAX(auction_status), MAX(s.stall_no)
    INTO v_auction_exists, v_auction_status, v_stall_no
    FROM auction a
    INNER JOIN stall s ON a.stall_id = s.stall_id
    WHERE a.auction_id = p_auction_id AND a.stall_id = p_stall_id;
    
    -- Validate auction exists
    IF v_auction_exists = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Auction not found for this stall';
    END IF;
    
    -- Check if auction is open for registration
    IF v_auction_status NOT IN ('Not Started', 'Waiting for Bidders', 'Active') THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Auction is not accepting registrations';
    END IF;
    
    -- Check if already registered
    SELECT COUNT(*)
    INTO v_already_registered
    FROM auction_participants
    WHERE auction_id = p_auction_id AND applicant_id = p_applicant_id;
    
    IF v_already_registered > 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'You are already registered for this auction';
    END IF;
    
    -- Get applicant name
    SELECT applicant_full_name
    INTO v_applicant_name
    FROM applicant
    WHERE applicant_id = p_applicant_id;
    
    -- Insert participant record
    INSERT INTO auction_participants (
        auction_id,
        stall_id,
        applicant_id,
        application_id,
        registration_status,
        notes
    ) VALUES (
        p_auction_id,
        p_stall_id,
        p_applicant_id,
        p_application_id,
        'Pre-Registered',
        CONCAT('Pre-registered by ', v_applicant_name, ' on ', NOW())
    );
    
    SET v_participant_id = LAST_INSERT_ID();
    
    -- Return the participant record
    SELECT 
        p.participant_id,
        p.auction_id,
        p.stall_id,
        p.applicant_id,
        p.application_id,
        p.registration_date,
        p.registration_status,
        v_stall_no as stall_no,
        v_applicant_name as applicant_name,
        'Successfully pre-registered for auction' as message
    FROM auction_participants p
    WHERE p.participant_id = v_participant_id;
    
END$$

DELIMITER ;

-- ========================================
-- STORED PROCEDURE: Check if applicant is registered for auction
-- ========================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `checkAuctionRegistration`$$

CREATE PROCEDURE `checkAuctionRegistration`(
    IN p_auction_id INT,
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        ap.participant_id,
        ap.auction_id,
        ap.stall_id,
        ap.applicant_id,
        ap.registration_date,
        ap.registration_status,
        s.stall_no,
        a.applicant_full_name
    FROM auction_participants ap
    INNER JOIN stall s ON ap.stall_id = s.stall_id
    INNER JOIN applicant a ON ap.applicant_id = a.applicant_id
    WHERE ap.auction_id = p_auction_id 
      AND ap.applicant_id = p_applicant_id;
END$$

DELIMITER ;

-- ========================================
-- STORED PROCEDURE: Get all participants for an auction
-- ========================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `getAuctionParticipants`$$

CREATE PROCEDURE `getAuctionParticipants`(
    IN p_auction_id INT
)
BEGIN
    SELECT 
        ap.participant_id,
        ap.auction_id,
        ap.stall_id,
        ap.applicant_id,
        ap.application_id,
        ap.registration_date,
        ap.registration_status,
        ap.bid_amount,
        ap.bid_time,
        ap.is_winning_bid,
        s.stall_no,
        a.applicant_full_name,
        a.applicant_contact_number,
        app.application_status
    FROM auction_participants ap
    INNER JOIN stall s ON ap.stall_id = s.stall_id
    INNER JOIN applicant a ON ap.applicant_id = a.applicant_id
    LEFT JOIN application app ON ap.application_id = app.application_id
    WHERE ap.auction_id = p_auction_id
    ORDER BY ap.registration_date ASC;
END$$

DELIMITER ;

-- ========================================
-- STORED PROCEDURE: Update participant bid (for actual bidding during auction)
-- ========================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `updateParticipantBid`$$

CREATE PROCEDURE `updateParticipantBid`(
    IN p_participant_id INT,
    IN p_bid_amount DECIMAL(10,2),
    IN p_is_winning_bid TINYINT(1)
)
BEGIN
    UPDATE auction_participants
    SET 
        bid_amount = p_bid_amount,
        bid_time = NOW(),
        is_winning_bid = p_is_winning_bid,
        registration_status = 'Participated',
        updated_at = NOW()
    WHERE participant_id = p_participant_id;
    
    -- Return updated record
    SELECT * FROM auction_participants WHERE participant_id = p_participant_id;
END$$

DELIMITER ;

-- Record migration execution
INSERT INTO `migrations` (`migration_name`, `version`) 
VALUES ('022_auction_participants_system', '1.0.0')
ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP();

-- Success message
SELECT '✅ Migration 022: Auction Participants System created successfully!' as status;
