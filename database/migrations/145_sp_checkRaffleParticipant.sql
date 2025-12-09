-- Migration: 145_sp_checkRaffleParticipant.sql
-- Description: sp_checkRaffleParticipant stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkRaffleParticipant`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkRaffleParticipant` (IN `p_raffle_id` INT, IN `p_applicant_id` INT)   BEGIN
  SELECT participant_id FROM raffle_participants 
  WHERE raffle_id = p_raffle_id AND applicant_id = p_applicant_id;
END$$

DELIMITER ;
