-- Migration: 157_sp_createRaffleResult.sql
-- Description: sp_createRaffleResult stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createRaffleResult`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createRaffleResult` (IN `p_raffle_id` INT, IN `p_winner_applicant_id` INT, IN `p_winner_application_id` INT, IN `p_total_participants` INT)   BEGIN
  INSERT INTO raffle_result (
    raffle_id, winner_applicant_id, winner_application_id, total_participants, result_date
  ) VALUES (
    p_raffle_id, p_winner_applicant_id, p_winner_application_id, p_total_participants, NOW()
  );
  
  SELECT LAST_INSERT_ID() as result_id;
END$$

DELIMITER ;
