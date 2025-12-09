-- Migration: 156_sp_createRaffleForStall.sql
-- Description: sp_createRaffleForStall stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createRaffleForStall`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createRaffleForStall` (IN `p_stall_id` INT, IN `p_start_date` DATETIME, IN `p_end_date` DATETIME, IN `p_min_participants` INT)   BEGIN
  INSERT INTO raffle (
    stall_id, start_date, end_date, min_participants, raffle_status, created_at
  ) VALUES (
    p_stall_id, p_start_date, p_end_date, p_min_participants, 'Ongoing', NOW()
  );
  
  SELECT LAST_INSERT_ID() as raffle_id;
END$$

DELIMITER ;
