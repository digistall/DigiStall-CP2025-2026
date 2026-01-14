-- =============================================
-- 424: Update Stored Procedures to Return Encrypted Fields
-- This allows backend decryption service to work properly
-- =============================================

-- =============================================
-- 1. sp_getInspectorByUsername - Return encrypted fields for backend decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        i.inspector_id,
        i.inspector_id as staff_id,
        i.username,
        i.first_name,
        i.last_name,
        i.email,
        i.password as password_hash,
        i.contact_no,
        i.status,
        ia.branch_id,
        b.branch_name,
        -- Include encrypted fields for backend decryption
        i.encrypted_first_name,
        i.encrypted_last_name,
        i.encrypted_contact,
        COALESCE(i.is_encrypted, 0) as is_encrypted
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.username = p_username COLLATE utf8mb4_general_ci 
    AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 2. sp_getCollectorByUsername - Return encrypted fields for backend decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        c.collector_id,
        c.collector_id as staff_id,
        c.username,
        c.first_name,
        c.last_name,
        c.email,
        c.password_hash,
        c.contact_no,
        c.status,
        ca.branch_id,
        b.branch_name,
        -- Include encrypted fields for backend decryption
        c.encrypted_first_name,
        c.encrypted_last_name,
        c.encrypted_contact,
        COALESCE(c.is_encrypted, 0) as is_encrypted
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username COLLATE utf8mb4_general_ci 
    AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 3. sp_getMobileUserByUsername - Return encrypted applicant fields
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getMobileUserByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getMobileUserByUsername`(
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
-- 4. sp_getStallholderByApplicantId - Return encrypted stallholder fields
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getStallholderByApplicantId`;

DELIMITER $$
CREATE PROCEDURE `sp_getStallholderByApplicantId`(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.branch_id,
        b.branch_name,
        sh.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.lease_amount,
        s.rental_price as monthly_rent,
        sh.payment_status,
        sh.compliance_status,
        -- Include encrypted fields for backend decryption
        sh.encrypted_name,
        sh.encrypted_contact,
        sh.encrypted_email,
        COALESCE(sh.is_encrypted, 0) as is_encrypted
    FROM stallholder sh
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    WHERE sh.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 5. sp_getSpouseByApplicantId - Return encrypted spouse fields
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getSpouseByApplicantId`;

DELIMITER $$
CREATE PROCEDURE `sp_getSpouseByApplicantId`(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sp.spouse_id,
        sp.spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        sp.spouse_contact_number,
        sp.spouse_occupation,
        -- Include encrypted fields for backend decryption
        sp.encrypted_full_name,
        sp.encrypted_contact,
        COALESCE(sp.is_encrypted, 0) as is_encrypted
    FROM spouse sp
    WHERE sp.applicant_id = p_applicant_id
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 6. sp_getApplicantById - Return encrypted applicant fields
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getApplicantById`;

DELIMITER $$
CREATE PROCEDURE `sp_getApplicantById`(
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
-- 7. Ensure spouse table has encryption columns
-- =============================================
-- Add columns if they don't exist using a stored procedure

DROP PROCEDURE IF EXISTS `sp_add_spouse_encryption_columns`;

DELIMITER $$
CREATE PROCEDURE `sp_add_spouse_encryption_columns`()
BEGIN
    -- Add encrypted_full_name if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'spouse' 
        AND COLUMN_NAME = 'encrypted_full_name'
    ) THEN
        ALTER TABLE spouse ADD COLUMN encrypted_full_name VARBINARY(512) NULL;
        SELECT 'Added encrypted_full_name column' as result;
    END IF;
    
    -- Add encrypted_contact if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'spouse' 
        AND COLUMN_NAME = 'encrypted_contact'
    ) THEN
        ALTER TABLE spouse ADD COLUMN encrypted_contact VARBINARY(128) NULL;
        SELECT 'Added encrypted_contact column' as result;
    END IF;
    
    -- Add is_encrypted if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.COLUMNS 
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'spouse' 
        AND COLUMN_NAME = 'is_encrypted'
    ) THEN
        ALTER TABLE spouse ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
        SELECT 'Added is_encrypted column' as result;
    END IF;
    
    SELECT 'Spouse encryption columns verified' as status;
END$$
DELIMITER ;

-- Run the procedure
CALL sp_add_spouse_encryption_columns();

-- Clean up
DROP PROCEDURE IF EXISTS `sp_add_spouse_encryption_columns`;

-- =============================================
-- 8. Encrypt spouse data
-- =============================================
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

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

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' spouse records') as result;

-- =============================================
-- 9. Verify procedures were created
-- =============================================
SELECT 'Verifying stored procedures...' as step;

SELECT ROUTINE_NAME, ROUTINE_TYPE, CREATED 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN (
    'sp_getInspectorByUsername',
    'sp_getCollectorByUsername', 
    'sp_getMobileUserByUsername',
    'sp_getStallholderByApplicantId',
    'sp_getSpouseByApplicantId',
    'sp_getApplicantById'
)
ORDER BY ROUTINE_NAME;

SELECT '✅ Migration 424 complete - Stored procedures updated to return encrypted fields!' as status;
