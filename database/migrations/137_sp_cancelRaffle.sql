-- Migration: 137_sp_cancelRaffle.sql
-- Description: sp_cancelRaffle stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_cancelRaffle`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_cancelRaffle` (IN `p_raffle_id` INT)   BEGIN
  UPDATE raffle SET raffle_status = 'Cancelled', updated_at = NOW() WHERE raffle_id = p_raffle_id;
END$$

DELIMITER ;
