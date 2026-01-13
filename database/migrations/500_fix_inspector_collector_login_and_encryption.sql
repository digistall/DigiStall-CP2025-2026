-- =============================================
-- Migration 500: Fix Inspector/Collector Login & Encryption
-- Date: 2026-01-10
-- Description: Fixes login issues and adds proper encryption
--              for inspector and collector accounts
-- =============================================

-- =============================================
-- SECTION 1: Add missing encryption columns
-- =============================================

-- Inspector table columns
SET @table_name = 'inspector';
SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_first_name'),
    'ALTER TABLE inspector ADD COLUMN encrypted_first_name VARBINARY(512) DEFAULT NULL',
    'SELECT "encrypted_first_name column already exists in inspector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_last_name'),
    'ALTER TABLE inspector ADD COLUMN encrypted_last_name VARBINARY(512) DEFAULT NULL',
    'SELECT "encrypted_last_name column already exists in inspector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_contact'),
    'ALTER TABLE inspector ADD COLUMN encrypted_contact VARBINARY(256) DEFAULT NULL',
    'SELECT "encrypted_contact column already exists in inspector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_email'),
    'ALTER TABLE inspector ADD COLUMN encrypted_email VARBINARY(256) DEFAULT NULL',
    'SELECT "encrypted_email column already exists in inspector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'is_encrypted'),
    'ALTER TABLE inspector ADD COLUMN is_encrypted TINYINT DEFAULT 0',
    'SELECT "is_encrypted column already exists in inspector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Collector table columns
SET @table_name = 'collector';
SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_first_name'),
    'ALTER TABLE collector ADD COLUMN encrypted_first_name VARBINARY(512) DEFAULT NULL',
    'SELECT "encrypted_first_name column already exists in collector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_last_name'),
    'ALTER TABLE collector ADD COLUMN encrypted_last_name VARBINARY(512) DEFAULT NULL',
    'SELECT "encrypted_last_name column already exists in collector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_contact'),
    'ALTER TABLE collector ADD COLUMN encrypted_contact VARBINARY(256) DEFAULT NULL',
    'SELECT "encrypted_contact column already exists in collector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'encrypted_email'),
    'ALTER TABLE collector ADD COLUMN encrypted_email VARBINARY(256) DEFAULT NULL',
    'SELECT "encrypted_email column already exists in collector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
    NOT EXISTS (SELECT * FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = @table_name 
                AND COLUMN_NAME = 'is_encrypted'),
    'ALTER TABLE collector ADD COLUMN is_encrypted TINYINT DEFAULT 0',
    'SELECT "is_encrypted column already exists in collector"'
));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SELECT '✅ SECTION 1: Encryption columns added/verified' as status;

-- =============================================
-- SECTION 2: Fix sp_getInspectorByUsername for login
-- Key fix: inspector table uses 'password' not 'password_hash'
-- =============================================
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
        -- IMPORTANT: Inspector table uses 'password' column for bcrypt hash
        -- Return as password_hash for consistency with auth controller
        COALESCE(i.password_hash, i.password) as password_hash,
        -- Decrypt contact
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
            ELSE i.contact_no 
        END as contact_no,
        i.status,
        i.date_hired,
        i.last_login,
        ia.branch_id,
        b.branch_name,
        i.is_encrypted
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (i.username = p_username COLLATE utf8mb4_general_ci OR i.email = p_username COLLATE utf8mb4_general_ci)
    AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

SELECT '✅ SECTION 2: sp_getInspectorByUsername fixed' as status;

-- =============================================
-- SECTION 3: Fix sp_getCollectorByUsername for login
-- Collector table uses 'password_hash'
-- =============================================
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
    WHERE (c.username = p_username COLLATE utf8mb4_general_ci OR c.email = p_username COLLATE utf8mb4_general_ci)
    AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

SELECT '✅ SECTION 3: sp_getCollectorByUsername fixed' as status;

-- =============================================
-- SECTION 4: Fix sp_createInspectorDirect with encryption
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
  
  -- Create masked names (show first 2 and last 2 chars)
  IF p_first_name IS NOT NULL AND LENGTH(p_first_name) > 4 THEN
    SET v_masked_first = CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2));
  ELSE
    SET v_masked_first = COALESCE(p_first_name, '***');
  END IF;
  
  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 4 THEN
    SET v_masked_last = CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2));
  ELSE
    SET v_masked_last = COALESCE(p_last_name, '***');
  END IF;
  
  IF p_contact_no IS NOT NULL AND LENGTH(p_contact_no) > 4 THEN
    SET v_masked_contact = CONCAT(LEFT(p_contact_no, 2), '***', RIGHT(p_contact_no, 2));
  ELSE
    SET v_masked_contact = p_contact_no;
  END IF;
  
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
    -- No encryption key available - store plain text
    INSERT INTO inspector (
      username, password, password_hash,
      first_name, last_name, middle_name,
      email, contact_no,
      date_hired, status, date_created,
      is_encrypted
    )
    VALUES (
      p_username, p_password_hash, p_password_hash,
      p_first_name, p_last_name, '',
      p_email, p_contact_no,
      CURDATE(), 'active', NOW(),
      0
    );
  END IF;
  
  SET v_inspector_id = LAST_INSERT_ID();
  SELECT v_inspector_id as inspector_id;
END$$
DELIMITER ;

SELECT '✅ SECTION 4: sp_createInspectorDirect fixed with encryption' as status;

-- =============================================
-- SECTION 5: Fix sp_createCollectorDirect with encryption
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
  
  -- Create masked names (show first 2 and last 2 chars)
  IF p_first_name IS NOT NULL AND LENGTH(p_first_name) > 4 THEN
    SET v_masked_first = CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2));
  ELSE
    SET v_masked_first = COALESCE(p_first_name, '***');
  END IF;
  
  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 4 THEN
    SET v_masked_last = CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2));
  ELSE
    SET v_masked_last = COALESCE(p_last_name, '***');
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
    -- No encryption key available - store plain text
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

SELECT '✅ SECTION 5: sp_createCollectorDirect fixed with encryption' as status;

-- =============================================
-- SECTION 6: Encrypt existing inspector data
-- =============================================
SET @encryption_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

SET SQL_SAFE_UPDATES = 0;

-- First, encrypt inspector data that hasn't been encrypted yet
UPDATE inspector 
SET 
    encrypted_first_name = AES_ENCRYPT(first_name, @encryption_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @encryption_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @encryption_key),
    encrypted_email = AES_ENCRYPT(email, @encryption_key),
    is_encrypted = 1
WHERE 
    first_name IS NOT NULL 
    AND first_name NOT LIKE '%***%'
    AND (is_encrypted = 0 OR is_encrypted IS NULL)
    AND @encryption_key IS NOT NULL;

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' inspector records (raw data)') as result;

-- Mask the plaintext fields for encrypted records
UPDATE inspector 
SET 
    first_name = CASE 
        WHEN LENGTH(first_name) > 4 THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2))
        ELSE CONCAT(first_name, '***')
    END,
    last_name = CASE 
        WHEN LENGTH(last_name) > 4 THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2))
        ELSE CONCAT(last_name, '***')
    END
WHERE 
    first_name IS NOT NULL 
    AND first_name NOT LIKE '%***%'
    AND is_encrypted = 1;

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' inspector plaintext fields') as result;

-- =============================================
-- SECTION 7: Encrypt existing collector data
-- =============================================

-- Encrypt collector data that hasn't been encrypted yet
UPDATE collector 
SET 
    encrypted_first_name = AES_ENCRYPT(first_name, @encryption_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @encryption_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @encryption_key),
    encrypted_email = AES_ENCRYPT(email, @encryption_key),
    is_encrypted = 1
WHERE 
    first_name IS NOT NULL 
    AND first_name NOT LIKE '%***%'
    AND (is_encrypted = 0 OR is_encrypted IS NULL)
    AND @encryption_key IS NOT NULL;

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' collector records (raw data)') as result;

-- Mask the plaintext fields for encrypted records
UPDATE collector 
SET 
    first_name = CASE 
        WHEN LENGTH(first_name) > 4 THEN CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2))
        ELSE CONCAT(first_name, '***')
    END,
    last_name = CASE 
        WHEN LENGTH(last_name) > 4 THEN CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2))
        ELSE CONCAT(last_name, '***')
    END
WHERE 
    first_name IS NOT NULL 
    AND first_name NOT LIKE '%***%'
    AND is_encrypted = 1;

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' collector plaintext fields') as result;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- SECTION 8: Verify the fix
-- =============================================

-- Test inspector login procedure
SELECT '-- Testing sp_getInspectorByUsername --' as test;
-- Call with existing username to verify it returns data with decrypted names

-- Verify encryption columns exist
SELECT 
    TABLE_NAME, 
    COLUMN_NAME 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
AND TABLE_NAME IN ('inspector', 'collector')
AND COLUMN_NAME IN ('encrypted_first_name', 'encrypted_last_name', 'encrypted_contact', 'encrypted_email', 'is_encrypted')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Count encrypted records
SELECT 
    'inspector' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM inspector
UNION ALL
SELECT 
    'collector' as table_name,
    COUNT(*) as total_records,
    SUM(CASE WHEN is_encrypted = 1 THEN 1 ELSE 0 END) as encrypted_records
FROM collector;

SELECT '✅ Migration 500 Complete - Inspector/Collector Login & Encryption Fixed!' as final_status;
