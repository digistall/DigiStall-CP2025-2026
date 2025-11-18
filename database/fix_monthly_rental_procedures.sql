-- Fix for Monthly Rental Display Issue
-- This fixes the stored procedures to show the correct monthly rental amount from stallholder table

-- Drop and recreate sp_get_all_stallholders with correct monthly_rent reference
DROP PROCEDURE IF EXISTS `sp_get_all_stallholders`;

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_all_stallholders` (IN `p_branch_id` INT)   
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        -- FIX: Use stallholder.monthly_rent instead of stall.rental_price
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.payment_status as paymentStatus
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
      AND sh.contract_status = 'Active'
    ORDER BY sh.stallholder_name ASC;
END;

-- sp_get_stallholder_details already has the correct logic, but let's verify
DROP PROCEDURE IF EXISTS `sp_get_stallholder_details`;

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_get_stallholder_details` (IN `p_stallholder_id` INT)   
BEGIN
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
END;
