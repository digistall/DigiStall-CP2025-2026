-- Migration: 221_sp_placeAuctionBid.sql
-- Description: sp_placeAuctionBid stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_placeAuctionBid`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_placeAuctionBid` (IN `p_auction_id` INT, IN `p_applicant_id` INT, IN `p_application_id` INT, IN `p_bid_amount` DECIMAL(10,2))   BEGIN
  -- Reset existing winning bids
  UPDATE auction_bids SET is_winning_bid = 0 WHERE auction_id = p_auction_id;
  
  -- Insert new bid as winning
  INSERT INTO auction_bids (
    auction_id, applicant_id, application_id, bid_amount, is_winning_bid, bid_time
  ) VALUES (
    p_auction_id, p_applicant_id, p_application_id, p_bid_amount, 1, NOW()
  );
  
  SELECT LAST_INSERT_ID() as bid_id;
END$$

DELIMITER ;
