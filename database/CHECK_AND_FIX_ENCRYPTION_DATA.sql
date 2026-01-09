-- =============================================
-- CHECK AND FIX ENCRYPTION DATA
-- Run this BEFORE migration 432 to diagnose issues
-- =============================================

USE naga_stall;

-- =============================================
-- STEP 1: Check current encryption status
-- =============================================

SELECT '===== INSPECTOR TABLE STATUS =====' as step;

SELECT 
    inspector_id,
    username,
    first_name,
    last_name,
    email,
    contact_no,
    is_encrypted,
    encrypted_first_name IS NOT NULL as has_enc_first,
    encrypted_last_name IS NOT NULL as has_enc_last,
    encrypted_email IS NOT NULL as has_enc_email,
    encrypted_contact IS NOT NULL as has_enc_contact,
    encrypted_phone IS NOT NULL as has_enc_phone
FROM inspector
ORDER BY inspector_id;

SELECT '===== COLLECTOR TABLE STATUS =====' as step;

SELECT 
    collector_id,
    username,
    first_name,
    last_name,
    email,
    contact_no,
    is_encrypted,
    encrypted_first_name IS NOT NULL as has_enc_first,
    encrypted_last_name IS NOT NULL as has_enc_last,
    encrypted_email IS NOT NULL as has_enc_email,
    encrypted_contact IS NOT NULL as has_enc_contact,
    encrypted_phone IS NOT NULL as has_enc_phone
FROM collector
ORDER BY collector_id;

-- =============================================
-- STEP 2: Test decryption on ONE inspector record
-- =============================================

SELECT '===== TESTING INSPECTOR DECRYPTION =====' as step;

SELECT 
    inspector_id,
    username,
    first_name as current_first_name,
    CAST(AES_DECRYPT(encrypted_first_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as decrypted_first_name,
    last_name as current_last_name,
    CAST(AES_DECRYPT(encrypted_last_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as decrypted_last_name,
    email as current_email,
    CAST(AES_DECRYPT(encrypted_email, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(255)) as decrypted_email
FROM inspector
WHERE inspector_id = 3  -- Jonas Laurente
LIMIT 1;

-- =============================================
-- STEP 3: Test decryption on ONE collector record
-- =============================================

SELECT '===== TESTING COLLECTOR DECRYPTION =====' as step;

SELECT 
    collector_id,
    username,
    first_name as current_first_name,
    CAST(AES_DECRYPT(encrypted_first_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as decrypted_first_name,
    last_name as current_last_name,
    CAST(AES_DECRYPT(encrypted_last_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as decrypted_last_name,
    email as current_email,
    CAST(AES_DECRYPT(encrypted_email, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(255)) as decrypted_email
FROM collector
WHERE collector_id = 1  -- First collector
LIMIT 1;

-- =============================================
-- STEP 4: Check if stored procedures exist
-- =============================================

SELECT '===== CHECKING STORED PROCEDURES =====' as step;

SELECT 
    ROUTINE_NAME,
    ROUTINE_TYPE,
    CREATED,
    LAST_ALTERED
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'naga_stall'
AND ROUTINE_NAME IN (
    'sp_getInspectorByUsername',
    'sp_getCollectorByUsername',
    'sp_getInspectorsAllDecrypted',
    'sp_getCollectorsAllDecrypted',
    'getAllComplianceRecordsDecrypted'
)
ORDER BY ROUTINE_NAME;

SELECT '✅ Diagnostic check complete!' as status;
SELECT 'If decrypted names show correctly above, the encrypted data is good.' as note;
SELECT 'Now run migration 432 to update the stored procedures.' as next_step;
