-- URGENT FIX: Update sp_getFullStallholderInfo with correct column names
-- The stallholder table has 'full_name' not 'stallholder_name'
-- mobile_user_id in stallholder IS the applicant_id (no mobile_user table exists)

USE naga_stall;

DROP PROCEDURE IF EXISTS `sp_getFullStallholderInfo`;

DELIMITER $$

CREATE PROCEDURE `sp_getFullStallholderInfo`(IN p_applicant_id INT)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.full_name as stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.branch_id,
        b.branch_name,
        sh.stall_id,
        s.stall_number,
        s.stall_location,
        s.size,
        sh.move_in_date as contract_start_date,
        sh.status as contract_status,
        s.monthly_rent,
        sh.payment_status
    FROM stallholder sh
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    INNER JOIN stall s ON sh.stall_id = s.stall_id
    WHERE sh.mobile_user_id = p_applicant_id
    LIMIT 1;
END$$

DELIMITER ;

SELECT 'sp_getFullStallholderInfo fixed successfully' as status;
