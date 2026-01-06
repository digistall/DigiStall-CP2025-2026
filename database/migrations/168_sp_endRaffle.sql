-- Migration: 168_sp_endRaffle.sql
-- Description: sp_endRaffle stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_endRaffle`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_endRaffle` (IN `p_raffle_id` INT)   BEGIN
  UPDATE raffle SET raffle_status = 'Ended' WHERE raffle_id = p_raffle_id;
END$$

DELIMITER ;
