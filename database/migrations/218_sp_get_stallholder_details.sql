-- Migration: 218_sp_get_stallholder_details.sql
-- Description: sp_get_stallholder_details stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_get_stallholder_details`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_stallholder_details` (IN `p_stallholder_id` INT)   BEGIN
    SELECT
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        -- This one is already correct - it prioritizes sh.monthly_rent
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.contract_status as contractStatus,
        sh.payment_status as paymentStatus,
        sh.last_payment_date as lastPaymentDate,
        'success' as status
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND sh.contract_status = 'Active';
END$$

DELIMITER ;
