-- =============================================
-- GET FULL STORED PROCEDURE DEFINITION
-- =============================================

USE naga_stall;

-- Get FULL procedure definition (not truncated)
SELECT ROUTINE_DEFINITION 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME = 'sp_getInspectorByUsername';

-- Alternative way
SELECT ROUTINE_NAME, ROUTINE_DEFINITION 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME IN ('sp_getInspectorByUsername', 'sp_getCollectorByUsername');

-- Check if it contains AES_DECRYPT
SELECT 
    ROUTINE_NAME,
    CASE 
        WHEN ROUTINE_DEFINITION LIKE '%AES_DECRYPT%' THEN 'YES - Uses AES_DECRYPT ✅'
        ELSE 'NO - Does NOT use AES_DECRYPT ❌'
    END as 'Has Decryption'
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME IN ('sp_getInspectorByUsername', 'sp_getCollectorByUsername');
