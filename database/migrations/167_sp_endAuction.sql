-- Migration: 167_sp_endAuction.sql
-- Description: sp_endAuction stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_endAuction`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_endAuction` (IN `p_auction_id` INT)   BEGIN
  UPDATE auction SET auction_status = 'Ended' WHERE auction_id = p_auction_id;
END$$

DELIMITER ;
