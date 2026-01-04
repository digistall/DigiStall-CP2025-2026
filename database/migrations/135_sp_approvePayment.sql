-- Migration: 135_sp_approvePayment.sql
-- Description: sp_approvePayment stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_approvePayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_approvePayment` (IN `p_payment_id` INT, IN `p_approved_by` INT)   BEGIN
  UPDATE payment 
  SET payment_status = 'Approved', approved_by = p_approved_by, approved_at = NOW() 
  WHERE payment_id = p_payment_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
