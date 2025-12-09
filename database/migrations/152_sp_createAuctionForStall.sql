-- Migration: 152_sp_createAuctionForStall.sql
-- Description: sp_createAuctionForStall stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createAuctionForStall`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createAuctionForStall` (IN `p_stall_id` INT, IN `p_starting_bid` DECIMAL(10,2), IN `p_bid_increment` DECIMAL(10,2), IN `p_start_date` DATETIME, IN `p_end_date` DATETIME)   BEGIN
  INSERT INTO auction (
    stall_id, starting_bid, bid_increment, start_date, end_date, auction_status, created_at
  ) VALUES (
    p_stall_id, p_starting_bid, p_bid_increment, p_start_date, p_end_date, 'Ongoing', NOW()
  );
  
  SELECT LAST_INSERT_ID() as auction_id;
END$$

DELIMITER ;
