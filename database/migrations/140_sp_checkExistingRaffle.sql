-- Migration: 140_sp_checkExistingRaffle.sql
-- Description: sp_checkExistingRaffle stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkExistingRaffle`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkExistingRaffle` (IN `p_stall_id` INT)   BEGIN
  SELECT raffle_id FROM raffle WHERE stall_id = p_stall_id;
END$$

DELIMITER ;
