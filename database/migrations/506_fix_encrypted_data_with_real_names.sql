-- =============================================
-- 506: Fix Inspector & Collector Encrypted Data
-- Replace masked data with real names, then encrypt
-- =============================================

-- =============================================
-- IMPORTANT: UPDATE THE REAL NAMES BELOW BEFORE RUNNING!
-- Replace 'REAL_FIRST_NAME' and 'REAL_LAST_NAME' with actual names
-- =============================================

-- =============================================
-- STEP 1: Reset encryption and update with real names
-- =============================================

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- First, reset encryption flag for all records
UPDATE inspector SET is_encrypted = 0;
UPDATE collector SET is_encrypted = 0;

-- =============================================
-- STEP 2: Update REAL NAMES for each person
-- IMPORTANT: Replace these with actual unmasked names!
-- =============================================

-- Inspector INS4526
UPDATE inspector 
SET 
    first_name = 'Test',
    last_name = 'Inspector',
    email = 'testinspector@example.com',
    contact_no = '09876543289'
WHERE username = 'INS4526';

-- Inspector INS1731
UPDATE inspector 
SET 
    first_name = 'Jonas',
    last_name = 'Laurente',
    email = 'jonas@example.com',
    contact_no = '09876543285'
WHERE username = 'INS1731';

-- Inspector INS2775
UPDATE inspector 
SET 
    first_name = 'Shaikim',
    last_name = 'Lu',
    email = 'shaikim@example.com',
    contact_no = '09876543223'
WHERE username = 'INS2775';

-- Collector COL3126
UPDATE collector 
SET 
    first_name = 'Jeno Aldrei',
    last_name = 'Laurente',
    email = 'laurentejeno73@gmail.com',
    contact_no = '09473430196'
WHERE username = 'COL3126';

-- Collector COL6386
UPDATE collector 
SET 
    first_name = 'Giuseppe',
    last_name = 'Arnaldo',
    email = 'archividox76@gmail.com',
    contact_no = '09352013057'
WHERE username = 'COL6386';

-- =============================================
-- STEP 3: Now encrypt all the real data
-- =============================================

-- Re-use the encryption procedures from migration 505
CALL sp_encryptInspectorData();
CALL sp_encryptCollectorData();

-- =============================================
-- STEP 4: Verify encryption
-- =============================================
SELECT 'Inspector Data After Encryption:' as verification;
SELECT 
    inspector_id,
    username,
    first_name,
    last_name,
    email,
    is_encrypted
FROM inspector;

SELECT 'Collector Data After Encryption:' as verification;
SELECT 
    collector_id,
    username,
    first_name,
    last_name,
    email,
    is_encrypted
FROM collector;

-- =============================================
-- STEP 5: Test decryption
-- =============================================
SELECT 'Testing Inspector Decryption:' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT 'Testing Collector Decryption:' as test;
CALL sp_getCollectorByUsername('COL3126');

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- INSTRUCTIONS:
-- 1. Update STEP 2 with the REAL unmasked names
-- 2. Run this entire script
-- 3. Check STEP 4 results - you should see encrypted binary data
-- 4. Check STEP 5 results - you should see decrypted readable names
-- =============================================
