-- Migration: Fix stored procedures to decrypt data on the fly
-- Description: Updates sp_getMobileUserByUsername and other SPs to return decrypted data
-- Date: 2026-01-10

DELIMITER //

-- Helper function to get encryption key
DROP FUNCTION IF EXISTS fn_getEncryptionKey//
CREATE FUNCTION fn_getEncryptionKey()
RETURNS VARCHAR(255)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE enc_key VARCHAR(255);
    SELECT encryption_key INTO enc_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    RETURN enc_key;
END//

-- SP: sp_getMobileUserByUsername - with decryption
DROP PROCEDURE IF EXISTS sp_getMobileUserByUsername//
CREATE PROCEDURE sp_getMobileUserByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE enc_key VARCHAR(255);
    SET enc_key = fn_getEncryptionKey();
    
    SELECT 
        c.registrationid,
        c.user_name,
        c.password_hash,
        a.applicant_id,
        -- Decrypt full name: prefer encrypted_full_name, fallback to regular columns
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_full_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_full_name, enc_key) AS CHAR(255))
            WHEN a.applicant_full_name IS NOT NULL AND a.applicant_full_name != '' THEN
                a.applicant_full_name
            ELSE
                CONCAT(
                    COALESCE(a.applicant_first_name, ''), ' ', 
                    COALESCE(a.applicant_middle_name, ''), ' ', 
                    COALESCE(a.applicant_last_name, '')
                )
        END AS applicant_full_name,
        -- Decrypt contact number
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_contact, enc_key) AS CHAR(50))
            ELSE a.applicant_contact_number 
        END AS applicant_contact_number,
        -- Decrypt email
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_email, enc_key) AS CHAR(255))
            ELSE o.email_address 
        END AS applicant_email,
        a.is_encrypted
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_info o ON a.applicant_id = o.applicant_id
    WHERE c.user_name COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END//

-- SP: sp_getApplicantById - with decryption
DROP PROCEDURE IF EXISTS sp_getApplicantById//
CREATE PROCEDURE sp_getApplicantById(
    IN p_applicant_id INT
)
BEGIN
    DECLARE enc_key VARCHAR(255);
    SET enc_key = fn_getEncryptionKey();
    
    SELECT 
        a.applicant_id,
        -- Decrypt full name
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_full_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_full_name, enc_key) AS CHAR(255))
            WHEN a.applicant_full_name IS NOT NULL AND a.applicant_full_name != '' THEN
                a.applicant_full_name
            ELSE
                CONCAT(
                    COALESCE(a.applicant_first_name, ''), ' ', 
                    COALESCE(a.applicant_middle_name, ''), ' ', 
                    COALESCE(a.applicant_last_name, '')
                )
        END AS applicant_full_name,
        -- Decrypt contact
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_contact, enc_key) AS CHAR(50))
            ELSE a.applicant_contact_number 
        END AS applicant_contact_number,
        -- Decrypt address
        CASE 
            WHEN a.is_encrypted = 1 AND a.encrypted_address IS NOT NULL THEN 
                CAST(AES_DECRYPT(a.encrypted_address, enc_key) AS CHAR(500))
            ELSE a.applicant_address 
        END AS applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        a.is_encrypted
    FROM applicant a
    WHERE a.applicant_id = p_applicant_id
    LIMIT 1;
END//

-- SP: sp_getSpouseByApplicantId - with decryption  
DROP PROCEDURE IF EXISTS sp_getSpouseByApplicantId//
CREATE PROCEDURE sp_getSpouseByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    DECLARE enc_key VARCHAR(255);
    SET enc_key = fn_getEncryptionKey();
    
    SELECT 
        s.spouse_id,
        s.applicant_id,
        -- Decrypt spouse name
        CASE 
            WHEN s.is_encrypted = 1 AND s.encrypted_spouse_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(s.encrypted_spouse_name, enc_key) AS CHAR(255))
            WHEN a.is_encrypted = 1 AND s.encrypted_spouse_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(s.encrypted_spouse_name, enc_key) AS CHAR(255))
            ELSE s.spouse_full_name 
        END AS spouse_full_name,
        s.spouse_birthdate,
        s.spouse_educational_attainment,
        -- Decrypt spouse contact
        CASE 
            WHEN s.is_encrypted = 1 AND s.encrypted_spouse_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(s.encrypted_spouse_contact, enc_key) AS CHAR(50))
            WHEN a.is_encrypted = 1 AND s.encrypted_spouse_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(s.encrypted_spouse_contact, enc_key) AS CHAR(50))
            ELSE s.spouse_contact_number 
        END AS spouse_contact_number,
        s.spouse_occupation
    FROM spouse s
    LEFT JOIN applicant a ON s.applicant_id = a.applicant_id
    WHERE s.applicant_id = p_applicant_id;
END//

-- SP: sp_getStallholderByApplicantId - with decryption
DROP PROCEDURE IF EXISTS sp_getStallholderByApplicantId//
CREATE PROCEDURE sp_getStallholderByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    DECLARE enc_key VARCHAR(255);
    SET enc_key = fn_getEncryptionKey();
    
    SELECT 
        sh.stallholder_id,
        sh.applicant_id,
        -- Decrypt stallholder name
        CASE 
            WHEN sh.is_encrypted = 1 AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, enc_key) AS CHAR(255))
            ELSE sh.stallholder_name 
        END AS stallholder_name,
        -- Decrypt contact
        CASE 
            WHEN sh.is_encrypted = 1 AND sh.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_contact, enc_key) AS CHAR(50))
            ELSE sh.contact_number 
        END AS contact_number,
        -- Decrypt email
        CASE 
            WHEN sh.is_encrypted = 1 AND sh.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_email, enc_key) AS CHAR(255))
            ELSE sh.email 
        END AS email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.branch_id,
        b.branch_name,
        sh.stall_id,
        s.stall_number AS stall_no,
        s.stall_location,
        s.size,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.lease_amount,
        sh.monthly_rent,
        sh.payment_status,
        sh.compliance_status
    FROM stallholder sh
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    WHERE sh.applicant_id = p_applicant_id;
END//

-- SP: sp_getInspectorByUsername - with decryption
DROP PROCEDURE IF EXISTS sp_getInspectorByUsername//
CREATE PROCEDURE sp_getInspectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE enc_key VARCHAR(255);
    SET enc_key = fn_getEncryptionKey();
    
    SELECT 
        i.inspector_id AS staff_id,
        i.inspector_id,
        -- Decrypt first name
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_first_name, enc_key) AS CHAR(100))
            ELSE i.first_name 
        END AS first_name,
        -- Decrypt last name
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_last_name, enc_key) AS CHAR(100))
            ELSE i.last_name 
        END AS last_name,
        i.username,
        i.password_hash,
        -- Decrypt email
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_email, enc_key) AS CHAR(255))
            ELSE i.email 
        END AS email,
        -- Decrypt contact
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_contact, enc_key) AS CHAR(50))
            ELSE i.contact_no 
        END AS contact_no,
        i.branch_id,
        b.branch_name,
        i.is_encrypted
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.username = p_username
    LIMIT 1;
END//

-- SP: sp_getCollectorByUsername - with decryption
DROP PROCEDURE IF EXISTS sp_getCollectorByUsername//
CREATE PROCEDURE sp_getCollectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE enc_key VARCHAR(255);
    SET enc_key = fn_getEncryptionKey();
    
    SELECT 
        c.collector_id AS staff_id,
        c.collector_id,
        -- Decrypt first name
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_first_name, enc_key) AS CHAR(100))
            ELSE c.first_name 
        END AS first_name,
        -- Decrypt last name
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_last_name, enc_key) AS CHAR(100))
            ELSE c.last_name 
        END AS last_name,
        c.username,
        c.password_hash,
        -- Decrypt email
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_email, enc_key) AS CHAR(255))
            ELSE c.email 
        END AS email,
        -- Decrypt contact
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(c.encrypted_contact, enc_key) AS CHAR(50))
            ELSE c.contact_no 
        END AS contact_no,
        c.branch_id,
        b.branch_name,
        c.is_encrypted
    FROM collector c
    LEFT JOIN branch b ON c.branch_id = b.branch_id
    WHERE c.username = p_username
    LIMIT 1;
END//

DELIMITER ;

-- Fix sp_getBusinessInfoByApplicantId - table name was wrong (business_info -> business_information)
DELIMITER //
DROP PROCEDURE IF EXISTS sp_getBusinessInfoByApplicantId//
CREATE PROCEDURE sp_getBusinessInfoByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        business_id,
        applicant_id,
        nature_of_business,
        capitalization,
        source_of_capital,
        previous_business_experience,
        relative_stall_owner,
        created_at,
        updated_at
    FROM business_information 
    WHERE applicant_id = p_applicant_id;
END//
DELIMITER ;

-- Fix sp_getOtherInfoByApplicantId - table name was wrong (other_info -> other_information)
DELIMITER //
DROP PROCEDURE IF EXISTS sp_getOtherInfoByApplicantId//
CREATE PROCEDURE sp_getOtherInfoByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        other_info_id,
        applicant_id,
        email_address,
        signature_of_applicant,
        house_sketch_location,
        valid_id,
        created_at,
        updated_at
    FROM other_information 
    WHERE applicant_id = p_applicant_id;
END//
DELIMITER ;

-- Verify
SELECT 'Stored procedures updated with decryption support' AS status;
