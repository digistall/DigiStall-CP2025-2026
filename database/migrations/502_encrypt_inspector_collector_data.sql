-- =============================================
-- Migration 502: Encrypt Inspector/Collector Data
-- Date: 2026-01-10
-- =============================================

-- Get the encryption key
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);
SELECT CONCAT('Encryption key found: ', IF(@enc_key IS NOT NULL, 'YES', 'NO')) as status;

-- =============================================
-- STEP 1: Check current inspector data BEFORE encryption
-- =============================================
SELECT '=== INSPECTOR DATA BEFORE ENCRYPTION ===' as step;
SELECT inspector_id, username, first_name, last_name, email, contact_no, 
       COALESCE(is_encrypted, 0) as is_encrypted
FROM inspector;

-- =============================================
-- STEP 2: Encrypt inspector data
-- =============================================
SET SQL_SAFE_UPDATES = 0;

UPDATE inspector 
SET 
    encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    is_encrypted = 1
WHERE @enc_key IS NOT NULL;

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' inspector records') as result;

-- Mask plaintext fields (keep first 2 and last 2 characters visible)
UPDATE inspector 
SET 
    first_name = CASE 
        WHEN LENGTH(first_name) > 4 THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2))
        ELSE CONCAT(LEFT(first_name, 1), '***')
    END,
    last_name = CASE 
        WHEN LENGTH(last_name) > 4 THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2))
        ELSE CONCAT(LEFT(last_name, 1), '***')
    END,
    contact_no = CASE 
        WHEN LENGTH(contact_no) > 4 THEN CONCAT(LEFT(contact_no, 2), '***', RIGHT(contact_no, 2))
        ELSE contact_no
    END
WHERE is_encrypted = 1 
AND first_name NOT LIKE '%***%';

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' inspector plaintext fields') as result;

-- =============================================
-- STEP 3: Verify inspector encryption - show decrypted values
-- =============================================
SELECT '=== INSPECTOR DATA AFTER ENCRYPTION (with decryption test) ===' as step;
SELECT 
    inspector_id, 
    username,
    first_name as masked_first_name,
    last_name as masked_last_name,
    CAST(AES_DECRYPT(encrypted_first_name, @enc_key) AS CHAR(100)) as decrypted_first_name,
    CAST(AES_DECRYPT(encrypted_last_name, @enc_key) AS CHAR(100)) as decrypted_last_name,
    CAST(AES_DECRYPT(encrypted_email, @enc_key) AS CHAR(255)) as decrypted_email,
    is_encrypted
FROM inspector;

-- =============================================
-- STEP 4: Check current collector data BEFORE encryption
-- =============================================
SELECT '=== COLLECTOR DATA BEFORE ENCRYPTION ===' as step;
SELECT collector_id, username, first_name, last_name, email, contact_no,
       COALESCE(is_encrypted, 0) as is_encrypted
FROM collector;

-- =============================================
-- STEP 5: Encrypt collector data
-- =============================================
UPDATE collector 
SET 
    encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    is_encrypted = 1
WHERE @enc_key IS NOT NULL;

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' collector records') as result;

-- Mask plaintext fields
UPDATE collector 
SET 
    first_name = CASE 
        WHEN LENGTH(first_name) > 4 THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2))
        ELSE CONCAT(LEFT(first_name, 1), '***')
    END,
    last_name = CASE 
        WHEN LENGTH(last_name) > 4 THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2))
        ELSE CONCAT(LEFT(last_name, 1), '***')
    END,
    contact_no = CASE 
        WHEN LENGTH(contact_no) > 4 THEN CONCAT(LEFT(contact_no, 2), '***', RIGHT(contact_no, 2))
        ELSE contact_no
    END
WHERE is_encrypted = 1 
AND first_name NOT LIKE '%***%';

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' collector plaintext fields') as result;

-- =============================================
-- STEP 6: Verify collector encryption - show decrypted values
-- =============================================
SELECT '=== COLLECTOR DATA AFTER ENCRYPTION (with decryption test) ===' as step;
SELECT 
    collector_id, 
    username,
    first_name as masked_first_name,
    last_name as masked_last_name,
    CAST(AES_DECRYPT(encrypted_first_name, @enc_key) AS CHAR(100)) as decrypted_first_name,
    CAST(AES_DECRYPT(encrypted_last_name, @enc_key) AS CHAR(100)) as decrypted_last_name,
    CAST(AES_DECRYPT(encrypted_email, @enc_key) AS CHAR(255)) as decrypted_email,
    is_encrypted
FROM collector;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- STEP 7: Update sp_getInspectorByUsername with decryption
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
        -- Decrypt first_name
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND i.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE i.first_name 
        END as first_name,
        -- Decrypt last_name
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND i.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE i.last_name 
        END as last_name,
        i.middle_name,
        -- Decrypt email
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND i.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
            ELSE i.email 
        END as email,
        -- Inspector uses 'password' column
        COALESCE(NULLIF(i.password_hash, ''), i.password) as password_hash,
        -- Decrypt contact
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND i.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
            ELSE i.contact_no 
        END as contact_no,
        i.status,
        i.date_hired,
        i.last_login,
        ia.branch_id,
        b.branch_name,
        COALESCE(i.is_encrypted, 0) as is_encrypted
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (i.username = p_username COLLATE utf8mb4_general_ci 
           OR i.email = p_username COLLATE utf8mb4_general_ci)
    AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

SELECT '✅ sp_getInspectorByUsername updated with decryption' as status;

-- =============================================
-- STEP 8: Update sp_getCollectorByUsername with decryption
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
        -- Decrypt first_name
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND c.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE c.first_name 
        END as first_name,
        -- Decrypt last_name
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND c.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE c.last_name 
        END as last_name,
        c.middle_name,
        -- Decrypt email
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND c.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
            ELSE c.email 
        END as email,
        c.password_hash,
        -- Decrypt contact
        CASE 
            WHEN COALESCE(c.is_encrypted, 0) = 1 AND c.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
            ELSE c.contact_no 
        END as contact_no,
        c.status,
        c.date_hired,
        c.last_login,
        ca.branch_id,
        b.branch_name,
        COALESCE(c.is_encrypted, 0) as is_encrypted
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (c.username = p_username COLLATE utf8mb4_general_ci 
           OR c.email = p_username COLLATE utf8mb4_general_ci)
    AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

SELECT '✅ sp_getCollectorByUsername updated with decryption' as status;

-- =============================================
-- STEP 9: Update sp_createInspectorDirect with auto-encryption
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
  
  -- Create masked versions
  SET v_masked_first = CASE 
      WHEN LENGTH(p_first_name) > 4 THEN CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2))
      ELSE CONCAT(LEFT(p_first_name, 1), '***')
  END;
  
  SET v_masked_last = CASE 
      WHEN LENGTH(p_last_name) > 4 THEN CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2))
      ELSE CONCAT(LEFT(p_last_name, 1), '***')
  END;
  
  SET v_masked_contact = CASE 
      WHEN LENGTH(p_contact_no) > 4 THEN CONCAT(LEFT(p_contact_no, 2), '***', RIGHT(p_contact_no, 2))
      ELSE p_contact_no
  END;
  
  IF v_key IS NOT NULL THEN
    -- Insert with encryption
    INSERT INTO inspector (
      username, password, password_hash,
      first_name, last_name, middle_name,
      email, contact_no,
      date_hired, status, date_created,
      encrypted_first_name, encrypted_last_name, encrypted_contact, encrypted_email,
      is_encrypted
    )
    VALUES (
      p_username, p_password_hash, p_password_hash,
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
    -- No encryption - store plain
    INSERT INTO inspector (
      username, password, password_hash,
      first_name, last_name, middle_name,
      email, contact_no,
      date_hired, status, date_created, is_encrypted
    )
    VALUES (
      p_username, p_password_hash, p_password_hash,
      p_first_name, p_last_name, '',
      p_email, p_contact_no,
      CURDATE(), 'active', NOW(), 0
    );
  END IF;
  
  SET v_inspector_id = LAST_INSERT_ID();
  SELECT v_inspector_id as inspector_id;
END$$
DELIMITER ;

SELECT '✅ sp_createInspectorDirect updated with auto-encryption' as status;

-- =============================================
-- STEP 10: Update sp_createCollectorDirect with auto-encryption
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
  
  -- Create masked versions
  SET v_masked_first = CASE 
      WHEN LENGTH(p_first_name) > 4 THEN CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2))
      ELSE CONCAT(LEFT(p_first_name, 1), '***')
  END;
  
  SET v_masked_last = CASE 
      WHEN LENGTH(p_last_name) > 4 THEN CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2))
      ELSE CONCAT(LEFT(p_last_name, 1), '***')
  END;
  
  SET v_masked_contact = CASE 
      WHEN LENGTH(p_contact_no) > 4 THEN CONCAT(LEFT(p_contact_no, 2), '***', RIGHT(p_contact_no, 2))
      ELSE p_contact_no
  END;
  
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
    -- No encryption - store plain
    INSERT INTO collector (
      username, password_hash,
      first_name, last_name, middle_name,
      email, contact_no,
      date_hired, status, date_created, is_encrypted
    )
    VALUES (
      p_username, p_password_hash,
      p_first_name, p_last_name, '',
      p_email, p_contact_no,
      CURDATE(), 'active', NOW(), 0
    );
  END IF;
  
  SET v_collector_id = LAST_INSERT_ID();
  SELECT v_collector_id as collector_id;
END$$
DELIMITER ;

SELECT '✅ sp_createCollectorDirect updated with auto-encryption' as status;

-- =============================================
-- STEP 11: Test the stored procedures
-- =============================================
SELECT '=== TESTING STORED PROCEDURES ===' as step;

SELECT '-- Test sp_getInspectorByUsername for INS1731 --' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT '-- Test sp_getCollectorByUsername for COL3126 --' as test;
CALL sp_getCollectorByUsername('COL3126');

SELECT '✅ Migration 502 Complete!' as final_status;
