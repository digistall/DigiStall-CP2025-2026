-- Migration: 222_sp_resetWinningBids.sql
-- Description: sp_resetWinningBids stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_resetWinningBids`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_resetWinningBids` (IN `p_auction_id` INT)   BEGIN
  UPDATE auction_bids SET is_winning_bid = 0 WHERE auction_id = p_auction_id;
END$$

DELIMITER ;
