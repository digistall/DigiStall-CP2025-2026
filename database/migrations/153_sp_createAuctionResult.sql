-- Migration: 153_sp_createAuctionResult.sql
-- Description: sp_createAuctionResult stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createAuctionResult`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createAuctionResult` (IN `p_auction_id` INT, IN `p_winner_applicant_id` INT, IN `p_winner_application_id` INT, IN `p_winning_bid` DECIMAL(10,2), IN `p_total_bidders` INT)   BEGIN
  INSERT INTO auction_result (
    auction_id, winner_applicant_id, winner_application_id, winning_bid, total_bidders, result_date
  ) VALUES (
    p_auction_id, p_winner_applicant_id, p_winner_application_id, p_winning_bid, p_total_bidders, NOW()
  );
  
  SELECT LAST_INSERT_ID() as result_id;
END$$

DELIMITER ;
