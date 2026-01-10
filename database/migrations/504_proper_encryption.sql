-- =============================================
-- Migration 504: Proper Encryption for Inspector/Collector
-- Date: 2026-01-10
-- 
-- PROBLEM: Current data is MASKED (Jo***as) not ENCRYPTED
-- SOLUTION: Store encrypted binary data properly
-- =============================================

-- =============================================
-- STEP 1: Get encryption key
-- =============================================
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);
SELECT IF(@enc_key IS NOT NULL, '✅ Encryption key found', '❌ No key!') as status;

-- =============================================
-- STEP 2: View current data (BEFORE)
-- =============================================
SELECT '=== INSPECTOR - BEFORE ===' as info;
SELECT inspector_id, username, first_name, last_name, email, contact_no, is_encrypted FROM inspector;

SELECT '=== COLLECTOR - BEFORE ===' as info;
SELECT collector_id, username, first_name, last_name, email, contact_no, is_encrypted FROM collector;

-- =============================================
-- STEP 3: ENCRYPT INSPECTOR DATA
-- The encrypted_* columns will store the REAL encrypted data
-- The first_name/last_name columns will store MASKED display values
-- =============================================
SET SQL_SAFE_UPDATES = 0;

-- For INS4526 (assuming original name was "Test Inspector" - adjust as needed)
UPDATE inspector SET
    encrypted_first_name = AES_ENCRYPT('Test', @enc_key),
    encrypted_last_name = AES_ENCRYPT('Inspector', @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    first_name = 'Te***st',
    last_name = 'In***or',
    is_encrypted = 1
WHERE username = 'INS4526';

-- For INS1731 (Jonas Laurente)
UPDATE inspector SET
    encrypted_first_name = AES_ENCRYPT('Jonas', @enc_key),
    encrypted_last_name = AES_ENCRYPT('Laurente', @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    first_name = 'Jo***as',
    last_name = 'La***te',
    is_encrypted = 1
WHERE username = 'INS1731';

-- For INS2775 (Shaikim Lu**Lu - adjust name)
UPDATE inspector SET
    encrypted_first_name = AES_ENCRYPT('Shaikim', @enc_key),
    encrypted_last_name = AES_ENCRYPT('Lu', @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    first_name = 'Sh***im',
    last_name = 'Lu***',
    is_encrypted = 1
WHERE username = 'INS2775';

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' inspector records') as result;

-- =============================================
-- STEP 4: ENCRYPT COLLECTOR DATA
-- =============================================

-- For COL3126 (Jeno Aldrei Laurente - from your original data)
UPDATE collector SET
    encrypted_first_name = AES_ENCRYPT('Jeno Aldrei', @enc_key),
    encrypted_last_name = AES_ENCRYPT('Laurente', @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    first_name = 'Je***ei',
    last_name = 'La***te',
    is_encrypted = 1
WHERE username = 'COL3126';

-- For COL6386 (G***pe Ar***do - adjust name)
UPDATE collector SET
    encrypted_first_name = AES_ENCRYPT('Giuseppe', @enc_key),
    encrypted_last_name = AES_ENCRYPT('Arnaldo', @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    first_name = 'Gi***pe',
    last_name = 'Ar***do',
    is_encrypted = 1
WHERE username = 'COL6386';

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' collector records') as result;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- STEP 5: VERIFY ENCRYPTION (show encrypted binary exists)
-- =============================================
SELECT '=== INSPECTOR - AFTER (with encrypted columns) ===' as info;
SELECT 
    inspector_id,
    username,
    first_name as masked_first,
    last_name as masked_last,
    CASE WHEN encrypted_first_name IS NOT NULL THEN 'HAS DATA' ELSE 'NULL' END as encrypted_first_status,
    CASE WHEN encrypted_last_name IS NOT NULL THEN 'HAS DATA' ELSE 'NULL' END as encrypted_last_status,
    is_encrypted
FROM inspector;

SELECT '=== COLLECTOR - AFTER (with encrypted columns) ===' as info;
SELECT 
    collector_id,
    username,
    first_name as masked_first,
    last_name as masked_last,
    CASE WHEN encrypted_first_name IS NOT NULL THEN 'HAS DATA' ELSE 'NULL' END as encrypted_first_status,
    CASE WHEN encrypted_last_name IS NOT NULL THEN 'HAS DATA' ELSE 'NULL' END as encrypted_last_status,
    is_encrypted
FROM collector;

-- =============================================
-- STEP 6: MANUAL DECRYPTION TEST
-- Run this to see decrypted values
-- =============================================
SELECT '=== MANUAL DECRYPT - INSPECTOR ===' as info;
SELECT 
    inspector_id,
    username,
    first_name as stored_masked,
    CAST(AES_DECRYPT(encrypted_first_name, @enc_key) AS CHAR(100)) as DECRYPTED_FIRST_NAME,
    last_name as stored_masked,
    CAST(AES_DECRYPT(encrypted_last_name, @enc_key) AS CHAR(100)) as DECRYPTED_LAST_NAME,
    CAST(AES_DECRYPT(encrypted_email, @enc_key) AS CHAR(255)) as DECRYPTED_EMAIL,
    CAST(AES_DECRYPT(encrypted_contact, @enc_key) AS CHAR(50)) as DECRYPTED_CONTACT
FROM inspector
WHERE is_encrypted = 1;

SELECT '=== MANUAL DECRYPT - COLLECTOR ===' as info;
SELECT 
    collector_id,
    username,
    first_name as stored_masked,
    CAST(AES_DECRYPT(encrypted_first_name, @enc_key) AS CHAR(100)) as DECRYPTED_FIRST_NAME,
    last_name as stored_masked,
    CAST(AES_DECRYPT(encrypted_last_name, @enc_key) AS CHAR(100)) as DECRYPTED_LAST_NAME,
    CAST(AES_DECRYPT(encrypted_email, @enc_key) AS CHAR(255)) as DECRYPTED_EMAIL,
    CAST(AES_DECRYPT(encrypted_contact, @enc_key) AS CHAR(50)) as DECRYPTED_CONTACT
FROM collector
WHERE is_encrypted = 1;

-- =============================================
-- STEP 7: UPDATE sp_getInspectorByUsername (auto-decrypt on login)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.inspector_id as staff_id,
        i.username,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE i.first_name 
        END as first_name,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE i.last_name 
        END as last_name,
        i.middle_name,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
            ELSE i.email 
        END as email,
        i.password as password_hash,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
            ELSE i.contact_no 
        END as contact_no,
        i.status,
        i.date_hired,
        i.last_login,
        i.branch_id,
        b.branch_name,
        i.is_encrypted
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE (i.username = p_username COLLATE utf8mb4_general_ci 
           OR i.email = p_username COLLATE utf8mb4_general_ci)
    AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- STEP 8: UPDATE sp_getCollectorByUsername (auto-decrypt on login)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.collector_id as staff_id,
        c.username,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE c.first_name 
        END as first_name,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE c.last_name 
        END as last_name,
        c.middle_name,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
            ELSE c.email 
        END as email,
        c.password_hash,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
            ELSE c.contact_no 
        END as contact_no,
        c.status,
        c.date_hired,
        c.last_login,
        ca.branch_id,
        b.branch_name,
        c.is_encrypted
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (c.username = p_username COLLATE utf8mb4_general_ci 
           OR c.email = p_username COLLATE utf8mb4_general_ci)
    AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- STEP 9: UPDATE sp_createInspectorDirect (auto-encrypt on create)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_createInspectorDirect`;

DELIMITER $$
CREATE PROCEDURE `sp_createInspectorDirect`(
  IN p_username VARCHAR(50),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_contact_no VARCHAR(20)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_inspector_id INT;
  DECLARE v_masked_first VARCHAR(100);
  DECLARE v_masked_last VARCHAR(100);
  DECLARE v_masked_contact VARCHAR(50);
  
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Create masked display values
  SET v_masked_first = CASE 
    WHEN LENGTH(p_first_name) > 4 THEN CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2))
    ELSE CONCAT(COALESCE(p_first_name, ''), '***')
  END;
  
  SET v_masked_last = CASE 
    WHEN LENGTH(p_last_name) > 4 THEN CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2))
    ELSE CONCAT(COALESCE(p_last_name, ''), '***')
  END;
  
  SET v_masked_contact = CASE 
    WHEN LENGTH(p_contact_no) > 4 THEN CONCAT(LEFT(p_contact_no, 2), '***', RIGHT(p_contact_no, 2))
    ELSE p_contact_no
  END;
  
  INSERT INTO inspector (
    username, password,
    first_name, last_name, middle_name,
    email, contact_no,
    date_hired, status,
    encrypted_first_name, encrypted_last_name, encrypted_contact, encrypted_email,
    is_encrypted
  )
  VALUES (
    p_username, p_password_hash,
    v_masked_first, v_masked_last, '',
    p_email, v_masked_contact,
    CURDATE(), 'active',
    AES_ENCRYPT(p_first_name, v_key),
    AES_ENCRYPT(p_last_name, v_key),
    AES_ENCRYPT(p_contact_no, v_key),
    AES_ENCRYPT(p_email, v_key),
    1
  );
  
  SET v_inspector_id = LAST_INSERT_ID();
  SELECT v_inspector_id as inspector_id;
END$$
DELIMITER ;

-- =============================================
-- STEP 10: UPDATE sp_createCollectorDirect (auto-encrypt on create)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_createCollectorDirect`;

DELIMITER $$
CREATE PROCEDURE `sp_createCollectorDirect`(
  IN p_username VARCHAR(50),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_contact_no VARCHAR(20)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_collector_id INT;
  DECLARE v_masked_first VARCHAR(100);
  DECLARE v_masked_last VARCHAR(100);
  DECLARE v_masked_contact VARCHAR(50);
  
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Create masked display values
  SET v_masked_first = CASE 
    WHEN LENGTH(p_first_name) > 4 THEN CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2))
    ELSE CONCAT(COALESCE(p_first_name, ''), '***')
  END;
  
  SET v_masked_last = CASE 
    WHEN LENGTH(p_last_name) > 4 THEN CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2))
    ELSE CONCAT(COALESCE(p_last_name, ''), '***')
  END;
  
  SET v_masked_contact = CASE 
    WHEN LENGTH(p_contact_no) > 4 THEN CONCAT(LEFT(p_contact_no, 2), '***', RIGHT(p_contact_no, 2))
    ELSE p_contact_no
  END;
  
  INSERT INTO collector (
    username, password_hash,
    first_name, last_name, middle_name,
    email, contact_no,
    date_hired, status, date_created,
    encrypted_first_name, encrypted_last_name, encrypted_contact, encrypted_email,
    is_encrypted
  )
  VALUES (
    p_username, p_password_hash,
    v_masked_first, v_masked_last, '',
    p_email, v_masked_contact,
    CURDATE(), 'active', NOW(),
    AES_ENCRYPT(p_first_name, v_key),
    AES_ENCRYPT(p_last_name, v_key),
    AES_ENCRYPT(p_contact_no, v_key),
    AES_ENCRYPT(p_email, v_key),
    1
  );
  
  SET v_collector_id = LAST_INSERT_ID();
  SELECT v_collector_id as collector_id;
END$$
DELIMITER ;

-- =============================================
-- STEP 11: TEST LOGIN PROCEDURES (should show decrypted names)
-- =============================================
SELECT '=== TEST: sp_getInspectorByUsername(INS1731) ===' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT '=== TEST: sp_getCollectorByUsername(COL3126) ===' as test;
CALL sp_getCollectorByUsername('COL3126');

-- =============================================
-- STEP 12: DONE
-- =============================================
SELECT '✅ Migration 504 Complete!' as status;
SELECT 'Database view: masked names (Jo***as)' as info1;
SELECT 'System calls: decrypted names (Jonas)' as info2;
SELECT 'New records: auto-encrypted' as info3;
