-- =============================================
-- 423: Verify and Fix Mobile Decryption + Spouse Encryption
-- Run this after 422 to ensure everything is working
-- =============================================

-- First, verify the encryption key exists
SELECT 'Checking encryption key...' as step;
SELECT key_name, is_active, LENGTH(encryption_key) as key_length FROM encryption_keys WHERE key_name = 'user_data_key';

-- =============================================
-- 1. RE-CREATE sp_getInspectorByUsername with decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    -- Get the encryption key
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.inspector_id as staff_id,
        i.username,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE COALESCE(i.first_name, '') 
        END as first_name,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE COALESCE(i.last_name, '') 
        END as last_name,
        i.email,
        i.password as password_hash,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(i.contact_no, '') 
        END as contact_no,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.username = p_username AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 2. RE-CREATE sp_getCollectorByUsername with decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.collector_id as staff_id,
        c.username,
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE COALESCE(c.first_name, '') 
        END as first_name,
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE COALESCE(c.last_name, '') 
        END as last_name,
        c.email,
        c.password_hash,
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(c.contact_no, '') 
        END as contact_no,
        c.status,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 3. RE-CREATE sp_getCredentialWithApplicant with decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCredentialWithApplicant`;

DELIMITER $$
CREATE PROCEDURE `sp_getCredentialWithApplicant`(
    IN p_username VARCHAR(100)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.created_date,
        c.last_login,
        c.is_active,
        -- Decrypt applicant name
        CASE 
            WHEN COALESCE(a.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND a.encrypted_full_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_full_name, v_key) AS CHAR(255))
            ELSE COALESCE(a.applicant_full_name, '') 
        END as applicant_full_name,
        -- Decrypt contact number
        CASE 
            WHEN COALESCE(a.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND a.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(a.applicant_contact_number, '') 
        END as applicant_contact_number,
        -- Decrypt address
        CASE 
            WHEN COALESCE(a.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND a.encrypted_address IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_address, v_key) AS CHAR(500))
            ELSE COALESCE(a.applicant_address, '') 
        END as applicant_address,
        -- Decrypt birthdate
        CASE 
            WHEN COALESCE(a.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND a.encrypted_birthdate IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_birthdate, v_key) AS CHAR(20))
            ELSE a.applicant_birthdate
        END as applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        COALESCE(oi.email_address, '') as applicant_email
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username AND c.is_active = 1
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 4. RE-CREATE sp_getFullStallholderInfo with decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getFullStallholderInfo`;

DELIMITER $$
CREATE PROCEDURE `sp_getFullStallholderInfo`(
    IN p_applicant_id INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        sh.stallholder_id,
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE COALESCE(sh.stallholder_name, '') 
        END as stallholder_name,
        sh.business_name,
        sh.business_type,
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(sh.contact_number, '') 
        END as stallholder_contact,
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
            ELSE COALESCE(sh.email, '') 
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
-- 5. RE-CREATE getApplicantAdditionalInfo with decryption
-- =============================================
DROP PROCEDURE IF EXISTS `getApplicantAdditionalInfo`;

DELIMITER $$
CREATE PROCEDURE `getApplicantAdditionalInfo`(
    IN p_applicant_id INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
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
            WHEN COALESCE(sp.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sp.encrypted_full_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sp.encrypted_full_name, v_key) AS CHAR(255))
            ELSE COALESCE(sp.spouse_full_name, '') 
        END as spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        CASE 
            WHEN COALESCE(sp.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sp.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sp.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(sp.spouse_contact_number, '') 
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
-- 6. RE-CREATE sp_getInspectorName with decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorName`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorName`(
    IN p_inspector_id INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE COALESCE(i.first_name, '') 
        END as first_name,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE COALESCE(i.last_name, '') 
        END as last_name
    FROM inspector i
    WHERE i.inspector_id = p_inspector_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 7. RE-CREATE sp_getCollectorName with decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorName`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorName`(
    IN p_collector_id INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE COALESCE(c.first_name, '') 
        END as first_name,
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE COALESCE(c.last_name, '') 
        END as last_name
    FROM collector c
    WHERE c.collector_id = p_collector_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 8. ENCRYPT SPOUSE DATA (if not already done)
-- =============================================
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

-- Check if spouse has encryption columns
SELECT 'Checking spouse table columns...' as step;
SELECT COLUMN_NAME FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'spouse' 
AND COLUMN_NAME IN ('encrypted_full_name', 'encrypted_contact', 'is_encrypted');

-- Encrypt spouse data where not already encrypted
UPDATE spouse 
SET 
    encrypted_full_name = AES_ENCRYPT(spouse_full_name, @enc_key),
    encrypted_contact = AES_ENCRYPT(spouse_contact_number, @enc_key),
    is_encrypted = 1
WHERE 
    spouse_id > 0
    AND (is_encrypted = 0 OR is_encrypted IS NULL)
    AND spouse_full_name IS NOT NULL 
    AND @enc_key IS NOT NULL;

SELECT CONCAT('Encrypted ', ROW_COUNT(), ' spouse records') as result;

-- =============================================
-- 9. TEST THE PROCEDURES
-- =============================================
SELECT 'Testing decryption procedures...' as step;

-- Test inspector procedure
SELECT 'Test sp_getInspectorByUsername:' as test;
CALL sp_getInspectorByUsername('inspector1');

-- Test applicant credential procedure
SELECT 'Test sp_getCredentialWithApplicant:' as test;
CALL sp_getCredentialWithApplicant('applicant1');

SELECT '✅ Migration 423 complete - Mobile decryption procedures verified!' as status;
