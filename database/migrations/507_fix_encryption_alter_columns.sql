-- =============================================
-- 507: Fix Inspector & Collector Encryption - Alter Columns to VARBINARY
-- Change VARCHAR columns to VARBINARY to store encrypted data
-- =============================================

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- =============================================
-- STEP 1: Reset encryption flag
-- =============================================
UPDATE inspector SET is_encrypted = 0;
UPDATE collector SET is_encrypted = 0;

-- =============================================
-- STEP 2: Update with real unmasked names first
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
-- STEP 3: Alter columns to VARBINARY for encrypted storage
-- =============================================

-- Inspector table
ALTER TABLE inspector 
    MODIFY COLUMN first_name VARBINARY(512),
    MODIFY COLUMN last_name VARBINARY(512),
    MODIFY COLUMN email VARBINARY(512),
    MODIFY COLUMN contact_no VARBINARY(512);

-- Collector table
ALTER TABLE collector 
    MODIFY COLUMN first_name VARBINARY(512),
    MODIFY COLUMN last_name VARBINARY(512),
    MODIFY COLUMN email VARBINARY(512),
    MODIFY COLUMN contact_no VARBINARY(512);

-- =============================================
-- STEP 4: Now encrypt all the real data
-- =============================================

CALL sp_encryptInspectorData();
CALL sp_encryptCollectorData();

-- =============================================
-- STEP 5: Verify encryption
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
-- STEP 6: Test decryption
-- =============================================
SELECT 'Testing Inspector Decryption:' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT 'Testing Collector Decryption:' as test;
CALL sp_getCollectorByUsername('COL3126');

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- DONE!
-- Inspector and Collector columns are now VARBINARY and encrypted
-- Stored procedures will decrypt on retrieval
-- =============================================
