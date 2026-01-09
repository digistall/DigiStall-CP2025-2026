-- =============================================
-- CRITICAL DIAGNOSTIC - What's in the encrypted BLOBs?
-- =============================================

USE naga_stall;

-- Test inspector ID 3 (Jonas)
SELECT '===== INSPECTOR ID 3 - DECRYPTION TEST =====' as test;

SELECT 
    inspector_id,
    username,
    
    -- Current plain columns (masked)
    first_name as 'CURRENT first_name (masked)',
    last_name as 'CURRENT last_name (masked)',
    email as 'CURRENT email (masked)',
    
    -- What's in the encrypted BLOBs when decrypted?
    CAST(AES_DECRYPT(encrypted_first_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as 'DECRYPTED from encrypted_first_name',
    
    CAST(AES_DECRYPT(encrypted_last_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as 'DECRYPTED from encrypted_last_name',
    
    CAST(AES_DECRYPT(encrypted_email, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(255)) as 'DECRYPTED from encrypted_email'
    
FROM inspector
WHERE inspector_id = 3;

-- Test collector ID 1
SELECT '===== COLLECTOR ID 1 - DECRYPTION TEST =====' as test;

SELECT 
    collector_id,
    username,
    
    -- Current plain columns (masked)
    first_name as 'CURRENT first_name (masked)',
    last_name as 'CURRENT last_name (masked)',
    email as 'CURRENT email (masked)',
    
    -- What's in the encrypted BLOBs when decrypted?
    CAST(AES_DECRYPT(encrypted_first_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as 'DECRYPTED from encrypted_first_name',
    
    CAST(AES_DECRYPT(encrypted_last_name, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(100)) as 'DECRYPTED from encrypted_last_name',
    
    CAST(AES_DECRYPT(encrypted_email, 
        (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' LIMIT 1)
    ) AS CHAR(255)) as 'DECRYPTED from encrypted_email'
    
FROM collector
WHERE collector_id = 1;

-- Check if stored procedures were updated
SELECT '===== STORED PROCEDURE STATUS =====' as test;

SELECT 
    ROUTINE_NAME as 'Procedure Name',
    CREATED as 'Created Date',
    LAST_ALTERED as 'Last Updated'
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'naga_stall'
AND ROUTINE_NAME IN ('sp_getInspectorByUsername', 'sp_getCollectorByUsername')
ORDER BY ROUTINE_NAME;

SELECT '===== CRITICAL: Check the DECRYPTED values above =====' as note;
SELECT 'If they show "Jo***as" instead of "Jonas", the BLOBs have masked data!' as warning;
