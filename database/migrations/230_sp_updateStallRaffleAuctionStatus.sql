-- Migration: 230_sp_updateStallRaffleAuctionStatus.sql
-- Description: sp_updateStallRaffleAuctionStatus stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_updateStallRaffleAuctionStatus`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateStallRaffleAuctionStatus` (IN `p_stall_id` INT, IN `p_status` VARCHAR(50))   BEGIN
  UPDATE stall SET raffle_auction_status = p_status WHERE stall_id = p_stall_id;
END$$

DELIMITER ;
