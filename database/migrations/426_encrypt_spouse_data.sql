-- =============================================
-- 426: Encrypt Spouse Data
-- This migration encrypts spouse sensitive information
-- =============================================

-- Get the encryption key
SET @encryption_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

SELECT CONCAT('🔑 Using encryption key: ', LEFT(@encryption_key, 4), '****') as info;

-- =============================================
-- 1. Encrypt spouse full name
-- =============================================
SET SQL_SAFE_UPDATES = 0;

-- Store encrypted version in encrypted_full_name column
UPDATE spouse 
SET encrypted_full_name = AES_ENCRYPT(spouse_full_name, @encryption_key)
WHERE spouse_full_name IS NOT NULL 
AND spouse_full_name != ''
AND spouse_full_name NOT LIKE '%***%'
AND (encrypted_full_name IS NULL OR LENGTH(encrypted_full_name) = 0);

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' spouse full names') as result;

-- =============================================
-- 2. Encrypt spouse contact number
-- =============================================
UPDATE spouse 
SET encrypted_contact = AES_ENCRYPT(spouse_contact_number, @encryption_key)
WHERE spouse_contact_number IS NOT NULL 
AND spouse_contact_number != ''
AND spouse_contact_number NOT LIKE '%****%'
AND (encrypted_contact IS NULL OR LENGTH(encrypted_contact) = 0);

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' spouse contact numbers') as result;

-- =============================================
-- 3. Mask the plaintext columns (privacy protection)
-- =============================================
-- Mask full name: "John Doe" -> "Jo***oe"
UPDATE spouse 
SET spouse_full_name = CONCAT(
    LEFT(spouse_full_name, 2), 
    '***', 
    RIGHT(spouse_full_name, 2)
)
WHERE spouse_full_name IS NOT NULL 
AND spouse_full_name != ''
AND spouse_full_name NOT LIKE '%***%'
AND encrypted_full_name IS NOT NULL;

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' spouse full names') as result;

-- Mask contact number: "09123456789" -> "09****89"
UPDATE spouse 
SET spouse_contact_number = CONCAT(
    LEFT(spouse_contact_number, 2), 
    '****', 
    RIGHT(spouse_contact_number, 2)
)
WHERE spouse_contact_number IS NOT NULL 
AND spouse_contact_number != ''
AND spouse_contact_number NOT LIKE '%****%'
AND encrypted_contact IS NOT NULL;

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' spouse contact numbers') as result;

-- =============================================
-- 4. Set is_encrypted flag
-- =============================================
UPDATE spouse 
SET is_encrypted = 1
WHERE encrypted_full_name IS NOT NULL;

SELECT CONCAT('✅ Set is_encrypted flag for ', ROW_COUNT(), ' spouse records') as result;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- 5. Verify encryption
-- =============================================
SELECT 
    spouse_id,
    spouse_full_name as masked_name,
    CASE WHEN encrypted_full_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_encrypted_name,
    spouse_contact_number as masked_contact,
    CASE WHEN encrypted_contact IS NOT NULL THEN 'YES' ELSE 'NO' END as has_encrypted_contact,
    is_encrypted
FROM spouse;

-- =============================================
-- 6. Test decryption (verify encryption works)
-- =============================================
SELECT 
    spouse_id,
    spouse_full_name as masked_name,
    CAST(AES_DECRYPT(encrypted_full_name, @encryption_key) AS CHAR) as decrypted_name,
    spouse_contact_number as masked_contact,
    CAST(AES_DECRYPT(encrypted_contact, @encryption_key) AS CHAR) as decrypted_contact
FROM spouse
WHERE encrypted_full_name IS NOT NULL;

SELECT '✅ Migration 426 complete - Spouse data encrypted!' as status;
