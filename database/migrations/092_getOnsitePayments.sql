-- Migration: 092_getOnsitePayments.sql
-- Description: getOnsitePayments stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getOnsitePayments`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getOnsitePayments` (IN `p_branch_id` INT, IN `p_start_date` DATE, IN `p_end_date` DATE, IN `p_limit` INT, IN `p_offset` INT)   BEGIN
        SELECT 
            p.payment_id,
            p.amount,
            p.payment_date,
            p.payment_time,
            p.payment_method,
            p.payment_status,
            p.payment_type,
            p.payment_for_month,
            p.reference_number,
            p.collected_by,
            p.notes,
            p.created_at,
            sh.stallholder_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.business_name,
            COALESCE(st.stall_no, 'N/A') as stall_no,
            COALESCE(st.stall_location, 'N/A') as stall_location,
            COALESCE(b.branch_name, 'Unknown') as branch_name
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE p.payment_method = 'onsite'
        AND (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
        AND (p_start_date IS NULL OR DATE(p.payment_date) >= p_start_date)
        AND (p_end_date IS NULL OR DATE(p.payment_date) <= p_end_date)
        ORDER BY p.payment_date DESC, p.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END$$

DELIMITER ;
