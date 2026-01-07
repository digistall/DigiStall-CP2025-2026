-- Migration: 139_sp_checkExistingAuction.sql
-- Description: sp_checkExistingAuction stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkExistingAuction`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkExistingAuction` (IN `p_stall_id` INT)   BEGIN
  SELECT auction_id FROM auction WHERE stall_id = p_stall_id;
END$$

DELIMITER ;
