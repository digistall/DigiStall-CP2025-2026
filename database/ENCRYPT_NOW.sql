-- =============================================
-- QUICK ENCRYPT ALL DATA - RUN THIS IN WORKBENCH
-- Execute each section one at a time (select and run)
-- =============================================

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- STEP 1: Get the encryption key
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

-- If no key exists, create one:
INSERT IGNORE INTO encryption_keys (key_name, encryption_key) 
VALUES ('user_data_key', SHA2('DigiStall_Secure_Key_2026_Change_In_Production', 256));

SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);
SELECT @enc_key as 'Encryption Key Found';

-- =============================================
-- STEP 2: ENCRYPT APPLICANT TABLE
-- =============================================
UPDATE applicant
SET 
  encrypted_full_name = AES_ENCRYPT(applicant_full_name, @enc_key),
  encrypted_contact = AES_ENCRYPT(applicant_contact_number, @enc_key),
  encrypted_email = AES_ENCRYPT(applicant_email, @enc_key),
  encrypted_address = AES_ENCRYPT(applicant_address, @enc_key),
  -- Mask visible fields
  applicant_full_name = CASE 
    WHEN applicant_full_name IS NOT NULL AND LENGTH(applicant_full_name) > 4 
    THEN CONCAT(LEFT(applicant_full_name, 2), '***', RIGHT(applicant_full_name, 2)) 
    ELSE applicant_full_name END,
  applicant_contact_number = CASE 
    WHEN applicant_contact_number IS NOT NULL AND LENGTH(applicant_contact_number) > 4 
    THEN CONCAT(LEFT(applicant_contact_number, 2), '****', RIGHT(applicant_contact_number, 2)) 
    ELSE applicant_contact_number END,
  applicant_email = CASE 
    WHEN applicant_email IS NOT NULL AND LENGTH(applicant_email) > 4 
    THEN CONCAT(LEFT(applicant_email, 2), '***@***.', RIGHT(applicant_email, 3)) 
    ELSE applicant_email END,
  applicant_address = CASE 
    WHEN applicant_address IS NOT NULL AND LENGTH(applicant_address) > 4 
    THEN CONCAT(LEFT(applicant_address, 2), '***', RIGHT(applicant_address, 2)) 
    ELSE applicant_address END,
  is_encrypted = 1
WHERE applicant_id > 0 AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Applicants encrypted: ', ROW_COUNT()) as result;

-- =============================================
-- STEP 3: ENCRYPT STALLHOLDER TABLE
-- =============================================
UPDATE stallholder
SET 
  encrypted_name = AES_ENCRYPT(stallholder_name, @enc_key),
  encrypted_contact = AES_ENCRYPT(contact_number, @enc_key),
  encrypted_email = AES_ENCRYPT(email, @enc_key),
  encrypted_address = AES_ENCRYPT(address, @enc_key),
  -- Mask visible fields
  stallholder_name = CASE 
    WHEN stallholder_name IS NOT NULL AND LENGTH(stallholder_name) > 4 
    THEN CONCAT(LEFT(stallholder_name, 2), '***', RIGHT(stallholder_name, 2)) 
    ELSE stallholder_name END,
  contact_number = CASE 
    WHEN contact_number IS NOT NULL AND LENGTH(contact_number) > 4 
    THEN CONCAT(LEFT(contact_number, 2), '****', RIGHT(contact_number, 2)) 
    ELSE contact_number END,
  email = CASE 
    WHEN email IS NOT NULL AND LENGTH(email) > 4 
    THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
    ELSE email END,
  address = CASE 
    WHEN address IS NOT NULL AND LENGTH(address) > 4 
    THEN CONCAT(LEFT(address, 2), '***', RIGHT(address, 2)) 
    ELSE address END,
  is_encrypted = 1
WHERE stallholder_id > 0 AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Stallholders encrypted: ', ROW_COUNT()) as result;

-- =============================================
-- STEP 4: ENCRYPT BUSINESS_MANAGER TABLE
-- =============================================
UPDATE business_manager
SET 
  encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
  encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
  encrypted_email = AES_ENCRYPT(email, @enc_key),
  encrypted_contact = AES_ENCRYPT(contact_number, @enc_key),
  -- Mask visible fields
  first_name = CASE 
    WHEN first_name IS NOT NULL AND LENGTH(first_name) > 4 
    THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2)) 
    ELSE first_name END,
  last_name = CASE 
    WHEN last_name IS NOT NULL AND LENGTH(last_name) > 4 
    THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2)) 
    ELSE last_name END,
  email = CASE 
    WHEN email IS NOT NULL AND LENGTH(email) > 4 
    THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
    ELSE email END,
  contact_number = CASE 
    WHEN contact_number IS NOT NULL AND LENGTH(contact_number) > 4 
    THEN CONCAT(LEFT(contact_number, 2), '****', RIGHT(contact_number, 2)) 
    ELSE contact_number END,
  is_encrypted = 1
WHERE business_manager_id > 0 AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Business Managers encrypted: ', ROW_COUNT()) as result;

-- =============================================
-- STEP 5: ENCRYPT BUSINESS_EMPLOYEE TABLE
-- =============================================
UPDATE business_employee
SET 
  encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
  encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
  encrypted_email = AES_ENCRYPT(email, @enc_key),
  encrypted_phone = AES_ENCRYPT(phone_number, @enc_key),
  -- Mask visible fields
  first_name = CASE 
    WHEN first_name IS NOT NULL AND LENGTH(first_name) > 4 
    THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2)) 
    ELSE first_name END,
  last_name = CASE 
    WHEN last_name IS NOT NULL AND LENGTH(last_name) > 4 
    THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2)) 
    ELSE last_name END,
  email = CASE 
    WHEN email IS NOT NULL AND LENGTH(email) > 4 
    THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
    ELSE email END,
  phone_number = CASE 
    WHEN phone_number IS NOT NULL AND LENGTH(phone_number) > 4 
    THEN CONCAT(LEFT(phone_number, 2), '****', RIGHT(phone_number, 2)) 
    ELSE phone_number END,
  is_encrypted = 1
WHERE business_employee_id > 0 AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Business Employees encrypted: ', ROW_COUNT()) as result;

-- =============================================
-- STEP 6: ENCRYPT INSPECTOR TABLE
-- =============================================
UPDATE inspector
SET 
  encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
  encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
  encrypted_email = AES_ENCRYPT(email, @enc_key),
  encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
  -- Mask visible fields
  first_name = CASE 
    WHEN first_name IS NOT NULL AND LENGTH(first_name) > 4 
    THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2)) 
    ELSE first_name END,
  last_name = CASE 
    WHEN last_name IS NOT NULL AND LENGTH(last_name) > 4 
    THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2)) 
    ELSE last_name END,
  email = CASE 
    WHEN email IS NOT NULL AND LENGTH(email) > 4 
    THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
    ELSE email END,
  contact_no = CASE 
    WHEN contact_no IS NOT NULL AND LENGTH(contact_no) > 4 
    THEN CONCAT(LEFT(contact_no, 2), '****', RIGHT(contact_no, 2)) 
    ELSE contact_no END,
  is_encrypted = 1
WHERE inspector_id > 0 AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Inspectors encrypted: ', ROW_COUNT()) as result;

-- =============================================
-- STEP 7: ENCRYPT COLLECTOR TABLE
-- =============================================
UPDATE collector
SET 
  encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
  encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
  encrypted_email = AES_ENCRYPT(email, @enc_key),
  encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
  -- Mask visible fields
  first_name = CASE 
    WHEN first_name IS NOT NULL AND LENGTH(first_name) > 4 
    THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2)) 
    ELSE first_name END,
  last_name = CASE 
    WHEN last_name IS NOT NULL AND LENGTH(last_name) > 4 
    THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2)) 
    ELSE last_name END,
  email = CASE 
    WHEN email IS NOT NULL AND LENGTH(email) > 4 
    THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
    ELSE email END,
  contact_no = CASE 
    WHEN contact_no IS NOT NULL AND LENGTH(contact_no) > 4 
    THEN CONCAT(LEFT(contact_no, 2), '****', RIGHT(contact_no, 2)) 
    ELSE contact_no END,
  is_encrypted = 1
WHERE collector_id > 0 AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Collectors encrypted: ', ROW_COUNT()) as result;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- FINAL: VERIFY ENCRYPTION
-- =============================================
SELECT '🔐 ENCRYPTION COMPLETE!' as status;

SELECT 'applicant' as tbl, applicant_full_name, applicant_contact_number, is_encrypted FROM applicant LIMIT 3;
SELECT 'business_manager' as tbl, first_name, last_name, email, is_encrypted FROM business_manager LIMIT 3;
SELECT 'inspector' as tbl, first_name, last_name, email, is_encrypted FROM inspector LIMIT 3;
SELECT 'collector' as tbl, first_name, last_name, email, is_encrypted FROM collector LIMIT 3;
