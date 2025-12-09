-- Migration: 223_sp_setRaffleWinner.sql
-- Description: sp_setRaffleWinner stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_setRaffleWinner`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_setRaffleWinner` (IN `p_participant_id` INT)   BEGIN
  UPDATE raffle_participants SET is_winner = 1 WHERE participant_id = p_participant_id;
END$$

DELIMITER ;
