-- Migration: 150_sp_countRaffleParticipants.sql
-- Description: sp_countRaffleParticipants stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_countRaffleParticipants`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_countRaffleParticipants` (IN `p_raffle_id` INT)   BEGIN
  SELECT COUNT(*) as count FROM raffle_participants WHERE raffle_id = p_raffle_id;
END$$

DELIMITER ;
