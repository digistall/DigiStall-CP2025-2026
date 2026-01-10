-- =============================================
-- 425: Complete Mobile Decryption Fix
-- This migration updates all mobile stored procedures to return encrypted fields
-- And sets is_encrypted flag on spouse data
-- =============================================

-- =============================================
-- 1. sp_getCredentialWithApplicant - Return encrypted fields
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCredentialWithApplicant`;

DELIMITER $$
CREATE PROCEDURE `sp_getCredentialWithApplicant`(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.created_date,
        c.last_login,
        c.is_active,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        COALESCE(oi.email_address, '') as applicant_email,
        -- Include encrypted fields for backend decryption
        a.encrypted_full_name,
        a.encrypted_contact,
        a.encrypted_address,
        a.encrypted_birthdate,
        COALESCE(a.is_encrypted, 0) as is_encrypted
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username COLLATE utf8mb4_general_ci 
    AND c.is_active = 1
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 2. sp_getFullStallholderInfo - Return encrypted fields
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getFullStallholderInfo`;

DELIMITER $$
CREATE PROCEDURE `sp_getFullStallholderInfo`(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.business_type,
        sh.contact_number as stallholder_contact,
        sh.email as stallholder_email,
        sh.address as stallholder_address,
        sh.branch_id,
        sh.stall_id,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.compliance_status,
        sh.payment_status,
        s.stall_no,
        s.size,
        s.rental_price as monthly_rent,
        s.stall_location,
        b.branch_name,
        b.area as branch_area,
        -- Include encrypted fields for backend decryption
        sh.encrypted_name,
        sh.encrypted_contact,
        sh.encrypted_email,
        COALESCE(sh.is_encrypted, 0) as is_encrypted
    FROM stallholder sh
    INNER JOIN stall s ON sh.stall_id = s.stall_id
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 3. getApplicantAdditionalInfo - Return encrypted spouse fields
-- =============================================
DROP PROCEDURE IF EXISTS `getApplicantAdditionalInfo`;

DELIMITER $$
CREATE PROCEDURE `getApplicantAdditionalInfo`(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        oi.email_address,
        oi.signature_of_applicant,
        oi.house_sketch_location,
        oi.valid_id,
        bi.nature_of_business,
        bi.capitalization,
        bi.source_of_capital,
        bi.previous_business_experience,
        bi.relative_stall_owner,
        -- Spouse info with encrypted fields
        sp.spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        sp.spouse_contact_number,
        sp.spouse_occupation,
        sp.encrypted_full_name as spouse_encrypted_full_name,
        sp.encrypted_contact as spouse_encrypted_contact,
        COALESCE(sp.is_encrypted, 0) as spouse_is_encrypted
    FROM applicant a
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
    WHERE a.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 4. Fix spouse is_encrypted flag - the data has BLOBs but flag not set
-- =============================================
SET SQL_SAFE_UPDATES = 0;

UPDATE spouse 
SET is_encrypted = 1
WHERE encrypted_full_name IS NOT NULL 
AND (is_encrypted = 0 OR is_encrypted IS NULL);

SET SQL_SAFE_UPDATES = 1;

SELECT CONCAT('✅ Updated is_encrypted flag for ', ROW_COUNT(), ' spouse records') as result;

-- =============================================
-- 5. Verify spouse encryption state
-- =============================================
SELECT 
    spouse_id,
    spouse_full_name,
    CASE WHEN encrypted_full_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_encrypted_data,
    is_encrypted
FROM spouse;

-- =============================================
-- 6. getApplicantById - Include encrypted fields  
-- =============================================
DROP PROCEDURE IF EXISTS `getApplicantById`;

DELIMITER $$
CREATE PROCEDURE `getApplicantById`(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        -- Include encrypted fields for backend decryption
        a.encrypted_full_name,
        a.encrypted_contact,
        a.encrypted_address,
        a.encrypted_birthdate,
        COALESCE(a.is_encrypted, 0) as is_encrypted
    FROM applicant a
    WHERE a.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 7. Verify procedures
-- =============================================
SELECT 'Verifying stored procedures...' as step;

SELECT ROUTINE_NAME, CREATED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN (
    'sp_getCredentialWithApplicant',
    'sp_getFullStallholderInfo',
    'getApplicantAdditionalInfo',
    'getApplicantById'
)
ORDER BY ROUTINE_NAME;

SELECT '✅ Migration 425 complete!' as status;
