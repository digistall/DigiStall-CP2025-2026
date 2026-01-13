-- Migration: 148_sp_countDistinctBidders.sql
-- Description: sp_countDistinctBidders stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_countDistinctBidders`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countDistinctBidders` (IN `p_auction_id` INT)   BEGIN
  SELECT COUNT(DISTINCT applicant_id) as bidders FROM auction_bids WHERE auction_id = p_auction_id;
END$$

DELIMITER ;
