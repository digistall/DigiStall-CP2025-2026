-- Migration: 147_sp_countAuctionBids.sql
-- Description: sp_countAuctionBids stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_countAuctionBids`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countAuctionBids` (IN `p_auction_id` INT)   BEGIN
  SELECT COUNT(*) as count FROM auction_bids WHERE auction_id = p_auction_id;
END$$

DELIMITER ;
