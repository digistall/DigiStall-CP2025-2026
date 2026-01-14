-- =============================================
-- FIX: Return RAW encrypted data from stallholder procedures
-- Backend will handle all decryption using Node.js crypto
-- =============================================

DROP PROCEDURE IF EXISTS `sp_get_all_stallholders_decrypted`;

CREATE PROCEDURE `sp_get_all_stallholders_decrypted`(IN `p_branch_id` INT)
BEGIN
    -- Return RAW encrypted fields - backend will decrypt
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
        sh.contract_start_date as contract_start_date,
        sh.last_payment_date as last_payment_date,
        sh.is_encrypted as is_encrypted
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
      AND sh.contract_status = 'Active'
      AND sh.payment_status != 'paid'
    ORDER BY sh.stallholder_name ASC;
END;

-- =============================================
-- GET STALLHOLDER DETAILS - Return RAW data
-- =============================================
DROP PROCEDURE IF EXISTS `sp_get_stallholder_details_decrypted`;

CREATE PROCEDURE `sp_get_stallholder_details_decrypted`(IN `p_stallholder_id` INT)
BEGIN
    -- Return RAW encrypted fields - backend will decrypt
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
        sh.contract_start_date as contract_start_date,
        sh.last_payment_date as last_payment_date,
        sh.is_encrypted as is_encrypted,
        'success' as status
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND sh.contract_status = 'Active';
END;

