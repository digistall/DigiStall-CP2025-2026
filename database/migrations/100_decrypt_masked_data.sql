-- Migration 100: Decrypt masked data from encrypted BLOB columns
-- Description: Updates regular columns with decrypted values from encrypted_* BLOB columns
-- This fixes the masked data issue where regular columns show "El***se" instead of full names
-- Date: 2026-01-10

-- Get the encryption key
SET @encryption_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

-- =====================================================
-- STEP 1: Update APPLICANT table
-- Decrypt encrypted BLOB columns and update regular columns
-- =====================================================

UPDATE applicant 
SET 
    applicant_full_name = CASE 
        WHEN is_encrypted = 1 AND encrypted_full_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_full_name, @encryption_key) AS CHAR(255))
        ELSE applicant_full_name 
    END,
    applicant_contact_number = CASE 
        WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_contact, @encryption_key) AS CHAR(50))
        ELSE applicant_contact_number 
    END,
    applicant_address = CASE 
        WHEN is_encrypted = 1 AND encrypted_address IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_address, @encryption_key) AS CHAR(500))
        ELSE applicant_address 
    END
WHERE is_encrypted = 1 
  AND encrypted_full_name IS NOT NULL;

-- Verify applicant updates
SELECT 'APPLICANT TABLE - After Update:' as message;
SELECT applicant_id, applicant_full_name, applicant_contact_number, applicant_address, is_encrypted
FROM applicant 
WHERE is_encrypted = 1
LIMIT 10;

-- =====================================================
-- STEP 2: Update SPOUSE table
-- =====================================================

-- First check if spouse table has encrypted columns
SELECT 'Checking SPOUSE table structure...' as message;

UPDATE spouse s
INNER JOIN applicant a ON s.applicant_id = a.applicant_id
SET 
    s.spouse_full_name = CASE 
        WHEN a.is_encrypted = 1 AND s.encrypted_spouse_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(s.encrypted_spouse_name, @encryption_key) AS CHAR(255))
        WHEN s.spouse_full_name LIKE '%***%' THEN s.spouse_full_name -- Keep masked if no encrypted version
        ELSE s.spouse_full_name 
    END,
    s.spouse_contact_number = CASE 
        WHEN a.is_encrypted = 1 AND s.encrypted_spouse_contact IS NOT NULL THEN 
            CAST(AES_DECRYPT(s.encrypted_spouse_contact, @encryption_key) AS CHAR(50))
        WHEN s.spouse_contact_number LIKE '%***%' THEN s.spouse_contact_number
        ELSE s.spouse_contact_number 
    END
WHERE a.is_encrypted = 1;

-- =====================================================
-- STEP 3: Update OTHER_INFORMATION table (email)
-- =====================================================

UPDATE other_information oi
INNER JOIN applicant a ON oi.applicant_id = a.applicant_id
SET 
    oi.email_address = CASE 
        WHEN a.is_encrypted = 1 AND a.encrypted_email IS NOT NULL THEN 
            CAST(AES_DECRYPT(a.encrypted_email, @encryption_key) AS CHAR(255))
        ELSE oi.email_address 
    END
WHERE a.is_encrypted = 1 
  AND a.encrypted_email IS NOT NULL;

-- =====================================================
-- STEP 4: Update BUSINESS_EMPLOYEE table
-- =====================================================

UPDATE business_employee 
SET 
    first_name = CASE 
        WHEN is_encrypted = 1 AND encrypted_first_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_first_name, @encryption_key) AS CHAR(100))
        ELSE first_name 
    END,
    last_name = CASE 
        WHEN is_encrypted = 1 AND encrypted_last_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_last_name, @encryption_key) AS CHAR(100))
        ELSE last_name 
    END,
    email = CASE 
        WHEN is_encrypted = 1 AND encrypted_email IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_email, @encryption_key) AS CHAR(255))
        ELSE email 
    END,
    contact_number = CASE 
        WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_contact, @encryption_key) AS CHAR(50))
        ELSE contact_number 
    END
WHERE is_encrypted = 1;

-- =====================================================
-- STEP 5: Update BUSINESS_MANAGER table
-- =====================================================

UPDATE business_manager 
SET 
    first_name = CASE 
        WHEN is_encrypted = 1 AND encrypted_first_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_first_name, @encryption_key) AS CHAR(100))
        ELSE first_name 
    END,
    last_name = CASE 
        WHEN is_encrypted = 1 AND encrypted_last_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_last_name, @encryption_key) AS CHAR(100))
        ELSE last_name 
    END,
    email = CASE 
        WHEN is_encrypted = 1 AND encrypted_email IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_email, @encryption_key) AS CHAR(255))
        ELSE email 
    END,
    contact_number = CASE 
        WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_contact, @encryption_key) AS CHAR(50))
        ELSE contact_number 
    END
WHERE is_encrypted = 1;

-- =====================================================
-- STEP 6: Update STALLHOLDER table
-- =====================================================

UPDATE stallholder 
SET 
    first_name = CASE 
        WHEN is_encrypted = 1 AND encrypted_first_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_first_name, @encryption_key) AS CHAR(100))
        ELSE first_name 
    END,
    last_name = CASE 
        WHEN is_encrypted = 1 AND encrypted_last_name IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_last_name, @encryption_key) AS CHAR(100))
        ELSE last_name 
    END,
    email = CASE 
        WHEN is_encrypted = 1 AND encrypted_email IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_email, @encryption_key) AS CHAR(255))
        ELSE email 
    END,
    contact_number = CASE 
        WHEN is_encrypted = 1 AND encrypted_contact IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_contact, @encryption_key) AS CHAR(50))
        ELSE contact_number 
    END,
    address = CASE 
        WHEN is_encrypted = 1 AND encrypted_address IS NOT NULL THEN 
            CAST(AES_DECRYPT(encrypted_address, @encryption_key) AS CHAR(500))
        ELSE address 
    END
WHERE is_encrypted = 1;

-- =====================================================
-- STEP 7: Final verification
-- =====================================================

SELECT 'FINAL VERIFICATION - Applicants:' as message;
SELECT applicant_id, applicant_full_name, applicant_contact_number, applicant_address
FROM applicant 
ORDER BY applicant_id;

SELECT 'FINAL VERIFICATION - Business Employees:' as message;
SELECT employee_id, first_name, last_name, email, contact_number
FROM business_employee
LIMIT 10;

SELECT 'FINAL VERIFICATION - Business Managers:' as message;
SELECT business_manager_id, first_name, last_name, email, contact_number
FROM business_manager
LIMIT 10;

SELECT 'FINAL VERIFICATION - Stallholders:' as message;
SELECT stallholder_id, first_name, last_name, email, contact_number
FROM stallholder
LIMIT 10;

-- Record this migration
INSERT INTO migrations (migration_id, migration_name, version, applied_at) 
VALUES (100, '100_decrypt_masked_data', '1.0.0', NOW())
ON DUPLICATE KEY UPDATE applied_at = NOW();

SELECT 'Migration 100 completed successfully!' as message;
