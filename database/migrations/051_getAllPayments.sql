-- Migration: 051_getAllPayments.sql
-- Description: getAllPayments stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllPayments`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllPayments` (IN `p_branch_id` INT, IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_payment_method` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_limit` INT, IN `p_offset` INT)   BEGIN
        SELECT 
            p.payment_id,
            p.stallholder_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.business_name,
            p.amount,
            p.payment_method,
            p.payment_status,
            p.payment_date,
            p.reference_number,
            p.branch_id,
            p.created_at
        FROM payments p
        LEFT JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        WHERE 1=1
        AND (p_branch_id IS NULL OR p.branch_id = p_branch_id OR sh.branch_id = p_branch_id)
        AND (p_start_date IS NULL OR DATE(p.payment_date) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(p.payment_date) <= p_end_date)
        AND (p_payment_method IS NULL OR p.payment_method = p_payment_method)
        AND (p_status IS NULL OR p.payment_status = p_status)
        ORDER BY p.payment_date DESC
        LIMIT p_limit OFFSET p_offset;
    END$$

DELIMITER ;
