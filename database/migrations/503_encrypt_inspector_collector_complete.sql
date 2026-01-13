-- =============================================
-- Migration 503: Complete Inspector/Collector Encryption
-- Date: 2026-01-10
-- 
-- INSTRUCTIONS:
-- 1. Run this script in MySQL Workbench section by section
-- 2. Check results after each section
-- =============================================

-- =============================================
-- SECTION 1: Check current encryption key
-- =============================================
SELECT '=== SECTION 1: Checking encryption key ===' as step;
SELECT key_name, LEFT(encryption_key, 20) as key_preview, is_active 
FROM encryption_keys 
WHERE key_name = 'user_data_key';

-- Store the key in a variable for this session
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);
SELECT IF(@enc_key IS NOT NULL, '✅ Encryption key found', '❌ No encryption key found!') as status;

-- =============================================
-- SECTION 2: Check current state of inspector data
-- =============================================
SELECT '=== SECTION 2: Current inspector data ===' as step;
SELECT 
    inspector_id,
    username,
    first_name,
    last_name,
    email,
    contact_no,
    CASE WHEN encrypted_first_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_encrypted_first,
    CASE WHEN encrypted_last_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_encrypted_last,
    is_encrypted
FROM inspector;

-- =============================================
-- SECTION 3: Check current state of collector data
-- =============================================
SELECT '=== SECTION 3: Current collector data ===' as step;
SELECT 
    collector_id,
    username,
    first_name,
    last_name,
    email,
    contact_no,
    CASE WHEN encrypted_first_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_encrypted_first,
    CASE WHEN encrypted_last_name IS NOT NULL THEN 'YES' ELSE 'NO' END as has_encrypted_last,
    is_encrypted
FROM collector;

-- =============================================
-- SECTION 4: Encrypt inspector data
-- This will encrypt the CURRENT values (even if masked)
-- If you have original unmasked data, update first_name/last_name first!
-- =============================================
SELECT '=== SECTION 4: Encrypting inspector data ===' as step;

SET SQL_SAFE_UPDATES = 0;

-- Encrypt all inspector records
UPDATE inspector 
SET 
    encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    is_encrypted = 1
WHERE @enc_key IS NOT NULL;

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' inspector records') as result;

-- =============================================
-- SECTION 5: Encrypt collector data
-- =============================================
SELECT '=== SECTION 5: Encrypting collector data ===' as step;

UPDATE collector 
SET 
    encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    is_encrypted = 1
WHERE @enc_key IS NOT NULL;

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' collector records') as result;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- SECTION 6: Verify encryption works (test decrypt)
-- =============================================
SELECT '=== SECTION 6: Verify decryption works ===' as step;

SELECT 
    inspector_id,
    username,
    first_name as stored_first_name,
    CAST(AES_DECRYPT(encrypted_first_name, @enc_key) AS CHAR(100)) as decrypted_first_name,
    last_name as stored_last_name,
    CAST(AES_DECRYPT(encrypted_last_name, @enc_key) AS CHAR(100)) as decrypted_last_name,
    is_encrypted
FROM inspector;

SELECT 
    collector_id,
    username,
    first_name as stored_first_name,
    CAST(AES_DECRYPT(encrypted_first_name, @enc_key) AS CHAR(100)) as decrypted_first_name,
    last_name as stored_last_name,
    CAST(AES_DECRYPT(encrypted_last_name, @enc_key) AS CHAR(100)) as decrypted_last_name,
    is_encrypted
FROM collector;

-- =============================================
-- SECTION 7: Update sp_getInspectorByUsername with decryption
-- =============================================
SELECT '=== SECTION 7: Updating sp_getInspectorByUsername ===' as step;

DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.inspector_id as staff_id,
        i.username,
        -- Decrypt first_name
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE i.first_name 
        END as first_name,
        -- Decrypt last_name
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE i.last_name 
        END as last_name,
        i.middle_name,
        -- Decrypt email
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
            ELSE i.email 
        END as email,
        -- Inspector uses 'password' column
        i.password as password_hash,
        -- Decrypt contact
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

SELECT '✅ sp_getInspectorByUsername updated' as status;

-- =============================================
-- SECTION 8: Update sp_getCollectorByUsername with decryption
-- =============================================
SELECT '=== SECTION 8: Updating sp_getCollectorByUsername ===' as step;

DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByUsername`(
    IN p_username VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.collector_id as staff_id,
        c.username,
        -- Decrypt first_name
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE c.first_name 
        END as first_name,
        -- Decrypt last_name
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE c.last_name 
        END as last_name,
        c.middle_name,
        -- Decrypt email
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
            ELSE c.email 
        END as email,
        c.password_hash,
        -- Decrypt contact
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

SELECT '✅ sp_getCollectorByUsername updated' as status;

-- =============================================
-- SECTION 9: Update sp_createInspectorDirect with auto-encryption
-- =============================================
SELECT '=== SECTION 9: Updating sp_createInspectorDirect ===' as step;

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
  DECLARE v_key VARCHAR(64) DEFAULT NULL;
  DECLARE v_inspector_id INT;
  DECLARE v_masked_first VARCHAR(100);
  DECLARE v_masked_last VARCHAR(100);
  DECLARE v_masked_contact VARCHAR(50);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Create masked names for display (first 2 + *** + last 2)
  IF p_first_name IS NOT NULL AND LENGTH(p_first_name) > 4 THEN
    SET v_masked_first = CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2));
  ELSE
    SET v_masked_first = CONCAT(COALESCE(p_first_name, ''), '***');
  END IF;
  
  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 4 THEN
    SET v_masked_last = CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2));
  ELSE
    SET v_masked_last = CONCAT(COALESCE(p_last_name, ''), '***');
  END IF;
  
  IF p_contact_no IS NOT NULL AND LENGTH(p_contact_no) > 4 THEN
    SET v_masked_contact = CONCAT(LEFT(p_contact_no, 2), '***', RIGHT(p_contact_no, 2));
  ELSE
    SET v_masked_contact = p_contact_no;
  END IF;
  
  IF v_key IS NOT NULL THEN
    -- Insert with encryption (store masked in plaintext, real data encrypted)
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
  ELSE
    -- No encryption key - store plain text
    INSERT INTO inspector (
      username, password,
      first_name, last_name, middle_name,
      email, contact_no,
      date_hired, status,
      is_encrypted
    )
    VALUES (
      p_username, p_password_hash,
      p_first_name, p_last_name, '',
      p_email, p_contact_no,
      CURDATE(), 'active',
      0
    );
  END IF;
  
  SET v_inspector_id = LAST_INSERT_ID();
  SELECT v_inspector_id as inspector_id;
END$$
DELIMITER ;

SELECT '✅ sp_createInspectorDirect updated with auto-encryption' as status;

-- =============================================
-- SECTION 10: Update sp_createCollectorDirect with auto-encryption
-- =============================================
SELECT '=== SECTION 10: Updating sp_createCollectorDirect ===' as step;

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
  DECLARE v_key VARCHAR(64) DEFAULT NULL;
  DECLARE v_collector_id INT;
  DECLARE v_masked_first VARCHAR(100);
  DECLARE v_masked_last VARCHAR(100);
  DECLARE v_masked_contact VARCHAR(50);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Create masked names for display
  IF p_first_name IS NOT NULL AND LENGTH(p_first_name) > 4 THEN
    SET v_masked_first = CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2));
  ELSE
    SET v_masked_first = CONCAT(COALESCE(p_first_name, ''), '***');
  END IF;
  
  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 4 THEN
    SET v_masked_last = CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2));
  ELSE
    SET v_masked_last = CONCAT(COALESCE(p_last_name, ''), '***');
  END IF;
  
  IF p_contact_no IS NOT NULL AND LENGTH(p_contact_no) > 4 THEN
    SET v_masked_contact = CONCAT(LEFT(p_contact_no, 2), '***', RIGHT(p_contact_no, 2));
  ELSE
    SET v_masked_contact = p_contact_no;
  END IF;
  
  IF v_key IS NOT NULL THEN
    -- Insert with encryption
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
  ELSE
    -- No encryption key - store plain text
    INSERT INTO collector (
      username, password_hash,
      first_name, last_name, middle_name,
      email, contact_no,
      date_hired, status, date_created,
      is_encrypted
    )
    VALUES (
      p_username, p_password_hash,
      p_first_name, p_last_name, '',
      p_email, p_contact_no,
      CURDATE(), 'active', NOW(),
      0
    );
  END IF;
  
  SET v_collector_id = LAST_INSERT_ID();
  SELECT v_collector_id as collector_id;
END$$
DELIMITER ;

SELECT '✅ sp_createCollectorDirect updated with auto-encryption' as status;

-- =============================================
-- SECTION 11: Test the login procedures
-- =============================================
SELECT '=== SECTION 11: Testing login procedures ===' as step;

-- Test inspector login (should return decrypted names)
SELECT '-- Testing INS1731 --' as test;
CALL sp_getInspectorByUsername('INS1731');

-- Test collector login (should return decrypted names)
SELECT '-- Testing COL3126 --' as test;
CALL sp_getCollectorByUsername('COL3126');

-- =============================================
-- SECTION 12: Final verification
-- =============================================
SELECT '=== SECTION 12: Final verification ===' as step;

SELECT 
    'inspector' as table_name,
    COUNT(*) as total,
    SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted,
    SUM(CASE WHEN encrypted_first_name IS NOT NULL THEN 1 ELSE 0 END) as has_encrypted_data
FROM inspector
UNION ALL
SELECT 
    'collector' as table_name,
    COUNT(*) as total,
    SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted,
    SUM(CASE WHEN encrypted_first_name IS NOT NULL THEN 1 ELSE 0 END) as has_encrypted_data
FROM collector;

SELECT '✅ Migration 503 Complete!' as final_status;
