-- Migration: 154_sp_createAuctionWaiting.sql
-- Description: sp_createAuctionWaiting stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createAuctionWaiting`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createAuctionWaiting` (IN `p_stall_id` INT, IN `p_starting_price` DECIMAL(10,2), IN `p_created_by_manager` INT)   BEGIN
  INSERT INTO auction (
    stall_id, starting_price, auction_status, created_by_manager, created_at
  ) VALUES (
    p_stall_id, p_starting_price, 'Waiting for Bidders', p_created_by_manager, NOW()
  );
  
  SELECT LAST_INSERT_ID() as auction_id;
END$$

DELIMITER ;
