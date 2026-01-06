-- Migration: 216_sp_get_payments_for_manager.sql
-- Description: sp_get_payments_for_manager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_payments_for_manager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_payments_for_manager` (IN `p_manager_id` INT, IN `p_limit` INT, IN `p_offset` INT, IN `p_search` VARCHAR(255))   BEGIN
            SELECT 
                p.payment_id as id,
                p.stallholder_id as stallholderId,
                COALESCE(sh.stallholder_name, 'Unknown') as stallholderName,
                COALESCE(st.stall_no, 'N/A') as stallNo,
                p.amount as amountPaid,
                p.payment_date as paymentDate,
                p.payment_time as paymentTime,
                p.payment_for_month as paymentForMonth,
                p.payment_type as paymentType,
                CASE 
                    WHEN p.payment_method = 'onsite' THEN 'Cash (Onsite)'
                    WHEN p.payment_method = 'online' THEN 'Online Payment'
                    WHEN p.payment_method = 'bank_transfer' THEN 'Bank Transfer'
                    WHEN p.payment_method = 'gcash' THEN 'GCash'
                    WHEN p.payment_method = 'maya' THEN 'Maya'
                    WHEN p.payment_method = 'paymaya' THEN 'PayMaya'
                    WHEN p.payment_method = 'check' THEN 'Check'
                    ELSE CONCAT(UPPER(SUBSTRING(p.payment_method, 1, 1)), LOWER(SUBSTRING(p.payment_method, 2)))
                END as paymentMethod,
                p.reference_number as referenceNo,
                p.collected_by as collectedBy,
                p.notes,
                p.payment_status as status,
                p.created_at as createdAt,
                COALESCE(b.branch_name, 'Unknown') as branchName
            FROM payments p
            LEFT JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
            LEFT JOIN stall st ON sh.stall_id = st.stall_id
            LEFT JOIN branch b ON sh.branch_id = b.branch_id
            ORDER BY p.created_at DESC
            LIMIT p_limit OFFSET p_offset;
        END$$

DELIMITER ;
