-- Migration 302: Fix Early Payment Discount - Add contract_start_date and last_payment_date to stallholder queries
-- This allows the frontend to calculate early payment discount (25% off if paid 5+ days before due date)
-- Run this migration in phpMyAdmin to enable the discount feature

DELIMITER $$

-- Drop existing procedures first
DROP PROCEDURE IF EXISTS `sp_get_all_stallholders`$$
DROP PROCEDURE IF EXISTS `sp_get_stallholder_details`$$

-- Recreate sp_get_all_stallholders with contract_start_date and last_payment_date
CREATE PROCEDURE `sp_get_all_stallholders` (IN `p_branch_id` INT)
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.payment_status as paymentStatus,
        -- Add these fields for early payment discount calculation
        sh.contract_start_date as contract_start_date,
        sh.last_payment_date as last_payment_date
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
      AND sh.contract_status = 'Active'
      AND sh.payment_status != 'paid'
    ORDER BY sh.stallholder_name ASC;
END$$

-- Recreate sp_get_stallholder_details with contract_start_date
CREATE PROCEDURE `sp_get_stallholder_details` (IN `p_stallholder_id` INT)
BEGIN
    SELECT
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.contract_status as contractStatus,
        sh.payment_status as paymentStatus,
        -- Add these fields for early payment discount calculation
        sh.contract_start_date as contract_start_date,
        sh.last_payment_date as last_payment_date,
        'success' as status
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND sh.contract_status = 'Active';
END$$

DELIMITER ;

-- Verify the procedures were created
SELECT 'Migration 302 completed!' as Status;
SELECT 'sp_get_all_stallholders and sp_get_stallholder_details now include contract_start_date and last_payment_date for discount calculation' as Info;
