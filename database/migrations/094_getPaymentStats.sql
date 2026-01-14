-- Migration: 094_getPaymentStats.sql
-- Description: getPaymentStats stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getPaymentStats`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getPaymentStats` (IN `p_branch_id` INT, IN `p_month` VARCHAR(7))   BEGIN
        SELECT 
            p.payment_method,
            COUNT(p.payment_id) as total_payments,
            SUM(p.amount) as total_amount,
            p.payment_status
        FROM payments p
        LEFT JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        WHERE 1=1
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR sh.branch_id = p_branch_id)
        AND (p_month IS NULL OR DATE_FORMAT(p.payment_date, '%Y-%m') = p_month)
        GROUP BY p.payment_method, p.payment_status
        ORDER BY p.payment_method, p.payment_status;
    END$$

DELIMITER ;
