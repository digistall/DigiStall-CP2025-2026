-- =============================================
-- 510: Encrypt Inspector & Collector Data (Like Applicant)
-- Uses MySQL AES_ENCRYPT to store sensitive data in varbinary columns
-- =============================================

SET SQL_SAFE_UPDATES = 0;

-- =============================================
-- STEP 1: Get encryption key from encryption_keys table
-- You need to replace 'YOUR_ENCRYPTION_KEY_HERE' with actual key
-- Run this query first to get the key:
-- SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1;
-- =============================================

SET @encryption_key = (
    SELECT encryption_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' 
    AND is_active = 1 
    LIMIT 1
);

-- Verify key was retrieved
SELECT CASE 
    WHEN @encryption_key IS NOT NULL THEN '✅ Encryption key loaded successfully'
    ELSE '❌ ERROR: No encryption key found! Please check encryption_keys table'
END AS status;

-- =============================================
-- STEP 2: Encrypt Inspector Data
-- =============================================

SELECT '========================================' AS '';
SELECT 'ENCRYPTING INSPECTOR DATA' AS '';
SELECT '========================================' AS '';

-- Encrypt Inspector INS4526 (Test Inspector)
UPDATE inspector 
SET 
    encrypted_first_name = AES_ENCRYPT('Test', @encryption_key),
    encrypted_last_name = AES_ENCRYPT('Inspector', @encryption_key),
    encrypted_email = AES_ENCRYPT('testinspector@example.com', @encryption_key),
    encrypted_contact = AES_ENCRYPT('09876543289', @encryption_key),
    is_encrypted = 1,
    -- Clear plain text fields
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    contact_no = NULL
WHERE username = 'INS4526';

SELECT CONCAT('✅ Encrypted Inspector: INS4526 - Test Inspector') AS result;

-- Encrypt Inspector INS1731 (Jonas Laurente)
UPDATE inspector 
SET 
    encrypted_first_name = AES_ENCRYPT('Jonas', @encryption_key),
    encrypted_last_name = AES_ENCRYPT('Laurente', @encryption_key),
    encrypted_email = AES_ENCRYPT('jonas@example.com', @encryption_key),
    encrypted_contact = AES_ENCRYPT('09876543285', @encryption_key),
    is_encrypted = 1,
    -- Clear plain text fields
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    contact_no = NULL
WHERE username = 'INS1731';

SELECT CONCAT('✅ Encrypted Inspector: INS1731 - Jonas Laurente') AS result;

-- Encrypt Inspector INS2775 (Shaikim Lu)
UPDATE inspector 
SET 
    encrypted_first_name = AES_ENCRYPT('Shaikim', @encryption_key),
    encrypted_last_name = AES_ENCRYPT('Lu', @encryption_key),
    encrypted_email = AES_ENCRYPT('shaikim@example.com', @encryption_key),
    encrypted_contact = AES_ENCRYPT('09876543223', @encryption_key),
    is_encrypted = 1,
    -- Clear plain text fields
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    contact_no = NULL
WHERE username = 'INS2775';

SELECT CONCAT('✅ Encrypted Inspector: INS2775 - Shaikim Lu') AS result;

-- =============================================
-- STEP 3: Encrypt Collector Data
-- =============================================

SELECT '========================================' AS '';
SELECT 'ENCRYPTING COLLECTOR DATA' AS '';
SELECT '========================================' AS '';

-- Encrypt Collector COL3126 (Jeno Aldrei Laurente)
UPDATE collector 
SET 
    encrypted_first_name = AES_ENCRYPT('Jeno Aldrei', @encryption_key),
    encrypted_last_name = AES_ENCRYPT('Laurente', @encryption_key),
    encrypted_email = AES_ENCRYPT('laurentejeno73@gmail.com', @encryption_key),
    encrypted_contact = AES_ENCRYPT('09473430196', @encryption_key),
    is_encrypted = 1,
    -- Clear plain text fields
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    contact_no = NULL
WHERE username = 'COL3126';

SELECT CONCAT('✅ Encrypted Collector: COL3126 - Jeno Aldrei Laurente') AS result;

-- Encrypt Collector COL6386 (Giuseppe Arnaldo)
UPDATE collector 
SET 
    encrypted_first_name = AES_ENCRYPT('Giuseppe', @encryption_key),
    encrypted_last_name = AES_ENCRYPT('Arnaldo', @encryption_key),
    encrypted_email = AES_ENCRYPT('archividox76@gmail.com', @encryption_key),
    encrypted_contact = AES_ENCRYPT('09352013057', @encryption_key),
    is_encrypted = 1,
    -- Clear plain text fields
    first_name = NULL,
    last_name = NULL,
    email = NULL,
    contact_no = NULL
WHERE username = 'COL6386';

SELECT CONCAT('✅ Encrypted Collector: COL6386 - Giuseppe Arnaldo') AS result;

-- =============================================
-- STEP 4: Update Stored Procedures to Handle Decryption
-- =============================================

SELECT '========================================' AS '';
SELECT 'UPDATING STORED PROCEDURES' AS '';
SELECT '========================================' AS '';

DELIMITER $$

-- Inspector Login/Get by Username (with decryption)
DROP PROCEDURE IF EXISTS sp_getInspectorByUsername$$
CREATE PROCEDURE sp_getInspectorByUsername(
    IN p_username VARCHAR(50)
)
BEGIN
    DECLARE v_encryption_key VARCHAR(255);
    
    -- Get encryption key
    SELECT encryption_key INTO v_encryption_key
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        i.password as password_hash,
        -- Decrypt sensitive fields
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_first_name, v_encryption_key) AS CHAR(255))
            ELSE i.first_name
        END as first_name,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_last_name, v_encryption_key) AS CHAR(255))
            ELSE i.last_name
        END as last_name,
        i.middle_name,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_email, v_encryption_key) AS CHAR(255))
            ELSE i.email
        END as email,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_contact, v_encryption_key) AS CHAR(50))
            ELSE i.contact_no
        END as contact_no,
        i.date_hired,
        i.status,
        i.termination_date,
        i.termination_reason,
        i.last_login,
        i.last_logout,
        i.branch_id,
        i.is_encrypted,
        b.branch_name,
        b.location
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.username = p_username COLLATE utf8mb4_general_ci 
    LIMIT 1;
END$$

-- Collector Login/Get by Username (with decryption)
DROP PROCEDURE IF EXISTS sp_getCollectorByUsername$$
CREATE PROCEDURE sp_getCollectorByUsername(
    IN p_username VARCHAR(50)
)
BEGIN
    DECLARE v_encryption_key VARCHAR(255);
    
    -- Get encryption key
    SELECT encryption_key INTO v_encryption_key
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        -- Decrypt sensitive fields
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_first_name, v_encryption_key) AS CHAR(255))
            ELSE c.first_name
        END as first_name,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_last_name, v_encryption_key) AS CHAR(255))
            ELSE c.last_name
        END as last_name,
        c.middle_name,
        c.collector_name,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_email, v_encryption_key) AS CHAR(255))
            ELSE c.email
        END as email,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_contact, v_encryption_key) AS CHAR(50))
            ELSE c.contact_no
        END as contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.termination_date,
        c.termination_reason,
        c.last_login,
        c.last_logout,
        c.is_encrypted,
        ca.branch_id,
        b.branch_name,
        b.location
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username COLLATE utf8mb4_general_ci 
    LIMIT 1;
END$$

-- Create Inspector with Encryption
DROP PROCEDURE IF EXISTS sp_createInspectorEncrypted$$
CREATE PROCEDURE sp_createInspectorEncrypted(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_middle_name VARCHAR(100),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(255),
    IN p_branch_id INT
)
BEGIN
    DECLARE v_encryption_key VARCHAR(255);
    
    -- Get encryption key
    SELECT encryption_key INTO v_encryption_key
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    INSERT INTO inspector (
        username, 
        password,
        encrypted_first_name,
        encrypted_last_name,
        middle_name,
        encrypted_email,
        encrypted_contact,
        branch_id,
        date_hired,
        status,
        is_encrypted
    ) VALUES (
        p_username,
        p_password_hash,
        AES_ENCRYPT(p_first_name, v_encryption_key),
        AES_ENCRYPT(p_last_name, v_encryption_key),
        p_middle_name,
        AES_ENCRYPT(p_email, v_encryption_key),
        AES_ENCRYPT(p_contact_no, v_encryption_key),
        p_branch_id,
        CURDATE(),
        'active',
        1
    );
    
    SELECT LAST_INSERT_ID() as inspector_id;
END$$

-- Create Collector with Encryption
DROP PROCEDURE IF EXISTS sp_createCollectorEncrypted$$
CREATE PROCEDURE sp_createCollectorEncrypted(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_middle_name VARCHAR(100),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(255)
)
BEGIN
    DECLARE v_encryption_key VARCHAR(255);
    
    -- Get encryption key
    SELECT encryption_key INTO v_encryption_key
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    INSERT INTO collector (
        username,
        password_hash,
        encrypted_first_name,
        encrypted_last_name,
        middle_name,
        encrypted_email,
        encrypted_contact,
        date_created,
        date_hired,
        status,
        is_encrypted
    ) VALUES (
        p_username,
        p_password_hash,
        AES_ENCRYPT(p_first_name, v_encryption_key),
        AES_ENCRYPT(p_last_name, v_encryption_key),
        p_middle_name,
        AES_ENCRYPT(p_email, v_encryption_key),
        AES_ENCRYPT(p_contact_no, v_encryption_key),
        NOW(),
        CURDATE(),
        'active',
        1
    );
    
    SELECT LAST_INSERT_ID() as collector_id;
END$$

DELIMITER ;

SELECT '✅ Stored procedures updated with encryption/decryption' AS result;

-- =============================================
-- STEP 5: Verify Encryption
-- =============================================

SELECT '========================================' AS '';
SELECT 'VERIFICATION - ENCRYPTED DATA' AS '';
SELECT '========================================' AS '';

-- Show encrypted inspector data (should show binary/blob)
SELECT 
    inspector_id,
    username,
    encrypted_first_name IS NOT NULL as has_encrypted_first,
    encrypted_last_name IS NOT NULL as has_encrypted_last,
    encrypted_email IS NOT NULL as has_encrypted_email,
    encrypted_contact IS NOT NULL as has_encrypted_contact,
    first_name IS NULL as plain_first_cleared,
    last_name IS NULL as plain_last_cleared,
    email IS NULL as plain_email_cleared,
    contact_no IS NULL as plain_contact_cleared,
    is_encrypted
FROM inspector
ORDER BY inspector_id;

SELECT '========================================' AS '';

-- Show encrypted collector data (should show binary/blob)
SELECT 
    collector_id,
    username,
    encrypted_first_name IS NOT NULL as has_encrypted_first,
    encrypted_last_name IS NOT NULL as has_encrypted_last,
    encrypted_email IS NOT NULL as has_encrypted_email,
    encrypted_contact IS NOT NULL as has_encrypted_contact,
    first_name IS NULL as plain_first_cleared,
    last_name IS NULL as plain_last_cleared,
    email IS NULL as plain_email_cleared,
    contact_no IS NULL as plain_contact_cleared,
    is_encrypted
FROM collector
ORDER BY collector_id;

-- =============================================
-- STEP 6: Test Decryption
-- =============================================

SELECT '========================================' AS '';
SELECT 'TESTING DECRYPTION' AS '';
SELECT '========================================' AS '';

-- Test Inspector decryption
CALL sp_getInspectorByUsername('INS1731');

SELECT '========================================' AS '';

-- Test Collector decryption
CALL sp_getCollectorByUsername('COL3126');

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

SELECT '========================================' AS '';
SELECT '✅ ENCRYPTION COMPLETED SUCCESSFULLY!' AS '';
SELECT '========================================' AS '';
SELECT '' AS '';
SELECT 'Inspector and Collector data is now encrypted like Applicant table' AS '';
SELECT 'Data is stored in varbinary columns using MySQL AES_ENCRYPT' AS '';
SELECT 'Stored procedures automatically decrypt data when retrieved' AS '';
SELECT '' AS '';
SELECT 'IMPORTANT: Update your Node.js backend to use the new stored procedures!' AS '';
SELECT '========================================' AS '';
