-- Migration: 080_getBusinessOwnerPaymentHistory.sql
-- Description: getBusinessOwnerPaymentHistory stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBusinessOwnerPaymentHistory`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBusinessOwnerPaymentHistory` (IN `p_business_owner_id` INT)   BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.payment_status,
        p.reference_number,
        p.receipt_number,
        p.payment_period_start,
        p.payment_period_end,
        p.notes,
        sa.username as processed_by,
        CONCAT(sa.first_name, ' ', sa.last_name) as processed_by_name
    FROM subscription_payments p
    LEFT JOIN system_administrator sa ON p.processed_by_system_admin = sa.system_admin_id
    WHERE p.business_owner_id = p_business_owner_id
    ORDER BY p.payment_date DESC;
END$$

DELIMITER ;
