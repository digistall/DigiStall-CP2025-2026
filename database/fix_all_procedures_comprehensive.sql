-- Comprehensive fixes for all broken procedures
-- 1. Fix sp_get_all_stallholders_decrypted to include full_name
-- 2. Fix getAllStallholders to include all needed data
-- 3. Fix sp_getAllStallholdersAllDecrypted

-- =============================================================================
-- FIX 1: sp_get_all_stallholders_decrypted (used by payment stallholders API)
-- =============================================================================
DROP PROCEDURE IF EXISTS `sp_get_all_stallholders_decrypted`;

DELIMITER $$

CREATE PROCEDURE `sp_get_all_stallholders_decrypted`(IN p_branch_id INT)
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.full_name as name,
        sh.full_name as stallholder_name,
        sh.contact_number as contact,
        sh.email,
        sh.address,
        sh.stall_id,
        s.stall_number as stallNo,
        s.stall_number,
        s.stall_location as stallLocation,
        s.monthly_rent as monthlyRental,
        s.monthly_rent as rental_price,
        sh.branch_id,
        b.branch_name as branchName,
        b.branch_name,
        sh.status as contract_status,
        sh.status as contractStatus,
        sh.payment_status,
        sh.move_in_date as contract_start_date,
        bi.nature_of_business as businessName,
        bi.nature_of_business as business_name,
        COALESCE(
            (SELECT COUNT(*) FROM payment_onsite po WHERE po.stallholder_id = sh.stallholder_id), 
            0
        ) as totalPayments,
        (SELECT MAX(payment_date) FROM payment_onsite po WHERE po.stallholder_id = sh.stallholder_id) as lastPaymentDate
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN applicant a ON sh.mobile_user_id = a.applicant_id
    LEFT JOIN business_info bi ON a.applicant_id = bi.applicant_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
    ORDER BY sh.stallholder_id;
END$$

DELIMITER ;

-- =============================================================================
-- FIX 2: getAllStallholders (used by stallholders page)
-- =============================================================================
DROP PROCEDURE IF EXISTS `getAllStallholders`;

DELIMITER $$

CREATE PROCEDURE `getAllStallholders`()
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.full_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.stall_id,
        sh.branch_id,
        sh.status,
        sh.payment_status,
        sh.move_in_date,
        s.stall_number,
        s.stall_name,
        s.stall_location,
        s.monthly_rent,
        b.branch_name,
        bi.nature_of_business as business_name,
        a.applicant_id
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN applicant a ON sh.mobile_user_id = a.applicant_id
    LEFT JOIN business_info bi ON a.applicant_id = bi.applicant_id
    ORDER BY sh.stallholder_id;
END$$

DELIMITER ;

-- =============================================================================
-- FIX 3: sp_getAllStallholdersAllDecrypted
-- =============================================================================
DROP PROCEDURE IF EXISTS `sp_getAllStallholdersAllDecrypted`;

DELIMITER $$

CREATE PROCEDURE `sp_getAllStallholdersAllDecrypted`()
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.full_name as name,
        sh.full_name as stallholder_name,
        sh.contact_number as contact,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.stall_id,
        s.stall_number as stallNo,
        s.stall_number,
        s.stall_location,
        s.monthly_rent,
        sh.branch_id,
        b.branch_name,
        sh.status,
        sh.payment_status,
        bi.nature_of_business as business_name
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN applicant a ON sh.mobile_user_id = a.applicant_id
    LEFT JOIN business_info bi ON a.applicant_id = bi.applicant_id
    ORDER BY sh.stallholder_id;
END$$

DELIMITER ;

-- =============================================================================
-- FIX 4: sp_get_stallholder_details_decrypted (used by stallholder details)
-- =============================================================================
DROP PROCEDURE IF EXISTS `sp_get_stallholder_details_decrypted`;

DELIMITER $$

CREATE PROCEDURE `sp_get_stallholder_details_decrypted`(IN p_stallholder_id INT)
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.full_name as name,
        sh.full_name as stallholder_name,
        sh.contact_number as contact,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.stall_id,
        s.stall_number as stallNo,
        s.stall_number,
        s.stall_location,
        s.monthly_rent,
        sh.branch_id,
        b.branch_name,
        sh.status as contract_status,
        sh.payment_status,
        sh.move_in_date as contract_start_date,
        bi.nature_of_business as business_name,
        bi.capitalization,
        bi.source_of_capital
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN applicant a ON sh.mobile_user_id = a.applicant_id
    LEFT JOIN business_info bi ON a.applicant_id = bi.applicant_id
    WHERE sh.stallholder_id = p_stallholder_id
    LIMIT 1;
END$$

DELIMITER ;

-- =============================================================================
-- FIX 5: getAllStalls (for dashboard stall overview)
-- =============================================================================
DROP PROCEDURE IF EXISTS `getAllStalls`;

DELIMITER $$

CREATE PROCEDURE `getAllStalls`()
BEGIN
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_name,
        s.stall_location,
        s.size,
        s.monthly_rent,
        s.status,
        s.is_available,
        s.price_type,
        s.branch_id,
        b.branch_name,
        b.area,
        (SELECT COUNT(*) FROM stall_images si WHERE si.stall_id = s.stall_id) as image_count
    FROM stall s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    ORDER BY s.stall_id;
END$$

DELIMITER ;

SELECT 'All stallholder and stall procedures fixed successfully!' as status;
