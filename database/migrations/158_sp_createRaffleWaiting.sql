-- Migration: 158_sp_createRaffleWaiting.sql
-- Description: sp_createRaffleWaiting stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createRaffleWaiting`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createRaffleWaiting` (IN `p_stall_id` INT, IN `p_created_by_manager` INT)   BEGIN
  INSERT INTO raffle (
    stall_id, raffle_status, created_by_manager, created_at
  ) VALUES (
    p_stall_id, 'Waiting for Participants', p_created_by_manager, NOW()
  );
  
  SELECT LAST_INSERT_ID() as raffle_id;
END$$

DELIMITER ;
