-- Migration: 129_sp_addRaffleParticipant.sql
-- Description: sp_addRaffleParticipant stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_addRaffleParticipant`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addRaffleParticipant` (IN `p_raffle_id` INT, IN `p_applicant_id` INT, IN `p_application_id` INT)   BEGIN
  INSERT INTO raffle_participants (raffle_id, applicant_id, application_id) 
  VALUES (p_raffle_id, p_applicant_id, p_application_id);
  
  UPDATE raffle SET total_participants = total_participants + 1 WHERE raffle_id = p_raffle_id;
  
  SELECT LAST_INSERT_ID() as participant_id;
END$$

DELIMITER ;
