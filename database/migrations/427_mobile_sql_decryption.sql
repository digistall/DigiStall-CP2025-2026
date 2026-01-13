-- =============================================
-- 427: Mobile SQL Decryption
-- This migration updates stored procedures to decrypt data in SQL
-- Same approach as web backend - decrypt in stored procedure, return plaintext
-- =============================================

-- =============================================
-- 1. sp_getCredentialWithApplicant - Decrypt applicant data in SQL
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCredentialWithApplicant`;

DELIMITER $$
CREATE PROCEDURE `sp_getCredentialWithApplicant`(
    IN p_username VARCHAR(100)
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.created_date,
        c.last_login,
        c.is_active,
        -- Decrypt fields if encrypted, otherwise use plaintext
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_full_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(a.encrypted_full_name, v_key) AS CHAR(500))
            ELSE a.applicant_full_name 
        END as applicant_full_name,
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(a.encrypted_contact, v_key) AS CHAR(255))
            ELSE a.applicant_contact_number 
        END as applicant_contact_number,
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_address IS NOT NULL 
            THEN CAST(AES_DECRYPT(a.encrypted_address, v_key) AS CHAR(1000))
            ELSE a.applicant_address 
        END as applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        COALESCE(oi.email_address, '') as applicant_email
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username COLLATE utf8mb4_general_ci 
    AND c.is_active = 1
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 2. sp_getFullStallholderInfo - Decrypt stallholder data in SQL
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getFullStallholderInfo`;

DELIMITER $$
CREATE PROCEDURE `sp_getFullStallholderInfo`(
    IN p_applicant_id INT
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        sh.stallholder_id,
        -- Decrypt stallholder name
        CASE 
            WHEN sh.is_encrypted = 1 AND sh.encrypted_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE sh.stallholder_name 
        END as stallholder_name,
        sh.business_name,
        sh.business_type,
        -- Decrypt contact
        CASE 
            WHEN sh.is_encrypted = 1 AND sh.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
            ELSE sh.contact_number 
        END as stallholder_contact,
        -- Decrypt email
        CASE 
            WHEN sh.is_encrypted = 1 AND sh.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
            ELSE sh.email 
        END as stallholder_email,
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
        b.area as branch_area
    FROM stallholder sh
    INNER JOIN stall s ON sh.stall_id = s.stall_id
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 3. getApplicantAdditionalInfo - Decrypt spouse data in SQL
-- =============================================
DROP PROCEDURE IF EXISTS `getApplicantAdditionalInfo`;

DELIMITER $$
CREATE PROCEDURE `getApplicantAdditionalInfo`(
    IN p_applicant_id INT
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
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
        -- Decrypt spouse info
        CASE 
            WHEN sp.is_encrypted = 1 AND sp.encrypted_full_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(sp.encrypted_full_name, v_key) AS CHAR(255))
            ELSE sp.spouse_full_name 
        END as spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        CASE 
            WHEN sp.is_encrypted = 1 AND sp.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(sp.encrypted_contact, v_key) AS CHAR(50))
            ELSE sp.spouse_contact_number 
        END as spouse_contact_number,
        sp.spouse_occupation
    FROM applicant a
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
    WHERE a.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 4. sp_getInspectorByUsername - Decrypt inspector data in SQL
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.inspector_id as staff_id,
        i.username,
        -- Decrypt first name
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE i.first_name 
        END as first_name,
        -- Decrypt last name
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE i.last_name 
        END as last_name,
        i.email,
        i.password as password_hash,
        -- Decrypt contact
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
            ELSE i.contact_no 
        END as contact_no,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.username = p_username COLLATE utf8mb4_general_ci 
    AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 5. sp_getCollectorByUsername - Decrypt collector data in SQL
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.collector_id as staff_id,
        c.username,
        -- Decrypt first name
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE c.first_name 
        END as first_name,
        -- Decrypt last name
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE c.last_name 
        END as last_name,
        c.email,
        c.password_hash,
        -- Decrypt contact
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
            ELSE c.contact_no 
        END as contact_no,
        c.status,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username COLLATE utf8mb4_general_ci 
    AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 6. getApplicantById - Decrypt applicant data in SQL
-- =============================================
DROP PROCEDURE IF EXISTS `getApplicantById`;

DELIMITER $$
CREATE PROCEDURE `getApplicantById`(
    IN p_applicant_id INT
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        a.applicant_id,
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_full_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(a.encrypted_full_name, v_key) AS CHAR(500))
            ELSE a.applicant_full_name 
        END as applicant_full_name,
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(a.encrypted_contact, v_key) AS CHAR(255))
            ELSE a.applicant_contact_number 
        END as applicant_contact_number,
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_address IS NOT NULL 
            THEN CAST(AES_DECRYPT(a.encrypted_address, v_key) AS CHAR(1000))
            ELSE a.applicant_address 
        END as applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment
    FROM applicant a
    WHERE a.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 7. Verify all procedures updated
-- =============================================
SELECT 'Verifying stored procedures...' as step;

SELECT ROUTINE_NAME, CREATED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN (
    'sp_getCredentialWithApplicant',
    'sp_getFullStallholderInfo',
    'getApplicantAdditionalInfo',
    'sp_getInspectorByUsername',
    'sp_getCollectorByUsername',
    'getApplicantById'
)
ORDER BY ROUTINE_NAME;

-- =============================================
-- 8. Test - Verify decryption works
-- =============================================
SELECT '🧪 Testing sp_getCredentialWithApplicant...' as test;
-- CALL sp_getCredentialWithApplicant('25-39683');

SELECT '✅ Migration 427 complete - SQL decryption for mobile!' as status;
