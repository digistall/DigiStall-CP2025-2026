-- Migration: 136_sp_cancelAuction.sql
-- Description: sp_cancelAuction stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_cancelAuction`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancelAuction` (IN `p_auction_id` INT)   BEGIN
  UPDATE auction SET auction_status = 'Cancelled', updated_at = NOW() WHERE auction_id = p_auction_id;
END$$

DELIMITER ;
