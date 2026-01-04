-- Migration: 159_sp_declinePayment.sql
-- Description: sp_declinePayment stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_declinePayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_declinePayment` (IN `p_payment_id` INT, IN `p_declined_by` INT, IN `p_decline_reason` TEXT)   BEGIN
  UPDATE payment 
  SET payment_status = 'Declined', declined_by = p_declined_by, declined_at = NOW(), decline_reason = p_decline_reason 
  WHERE payment_id = p_payment_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
