-- Migration: 219_sp_logRaffleAuctionActivity.sql
-- Description: sp_logRaffleAuctionActivity stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_logRaffleAuctionActivity`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_logRaffleAuctionActivity` (IN `p_stall_id` INT, IN `p_event_type` VARCHAR(100), IN `p_raffle_id` INT, IN `p_auction_id` INT, IN `p_applicant_id` INT, IN `p_application_id` INT, IN `p_bid_amount` DECIMAL(10,2), IN `p_notes` TEXT)   BEGIN
  INSERT INTO raffle_auction_log (
    stall_id, event_type, raffle_id, auction_id, applicant_id, application_id, bid_amount, notes, created_at
  ) VALUES (
    p_stall_id, p_event_type, p_raffle_id, p_auction_id, p_applicant_id, p_application_id, p_bid_amount, p_notes, NOW()
  );
  
  SELECT LAST_INSERT_ID() as log_id;
END$$

DELIMITER ;
