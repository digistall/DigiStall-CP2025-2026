-- =============================================
-- 428: Fix Collector and Inspector Tables + Decryption
-- This migration adds missing columns and fixes decryption
-- =============================================
-- INSTRUCTION: Run this file section by section.
-- If a column already exists, you'll get an error - just skip to next section.
-- =============================================

-- =============================================
-- SECTION 1: Add missing columns to collector table
-- Run each line one at a time, ignore "Duplicate column" errors
-- =============================================

ALTER TABLE collector ADD COLUMN encrypted_first_name VARBINARY(512) DEFAULT NULL;
ALTER TABLE collector ADD COLUMN encrypted_last_name VARBINARY(512) DEFAULT NULL;
ALTER TABLE collector ADD COLUMN encrypted_contact VARBINARY(256) DEFAULT NULL;
ALTER TABLE collector ADD COLUMN is_encrypted TINYINT DEFAULT 0;

-- =============================================
-- SECTION 2: Add missing columns to inspector table
-- Run each line one at a time, ignore "Duplicate column" errors
-- =============================================

ALTER TABLE inspector ADD COLUMN encrypted_first_name VARBINARY(512) DEFAULT NULL;
ALTER TABLE inspector ADD COLUMN encrypted_last_name VARBINARY(512) DEFAULT NULL;
ALTER TABLE inspector ADD COLUMN encrypted_contact VARBINARY(256) DEFAULT NULL;
ALTER TABLE inspector ADD COLUMN is_encrypted TINYINT DEFAULT 0;

SELECT '✅ Columns added (ignore any duplicate column errors above)' as status;

-- =============================================
-- SECTION 3: Fix sp_createCollectorDirect to handle encryption
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
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Create masked names
  IF p_first_name IS NOT NULL AND LENGTH(p_first_name) > 4 THEN
    SET v_masked_first = CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2));
  ELSE
    SET v_masked_first = p_first_name;
  END IF;
  
  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 4 THEN
    SET v_masked_last = CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2));
  ELSE
    SET v_masked_last = p_last_name;
  END IF;
  
  IF v_key IS NOT NULL THEN
    -- Insert with encryption
    INSERT INTO collector (
      username, password_hash, 
      first_name, last_name,
      email, contact_no, 
      date_created, status,
      encrypted_first_name, encrypted_last_name, encrypted_contact,
      is_encrypted
    )
    VALUES (
      p_username, p_password_hash, 
      v_masked_first, v_masked_last,
      p_email, p_contact_no, 
      NOW(), 'active',
      AES_ENCRYPT(p_first_name, v_key),
      AES_ENCRYPT(p_last_name, v_key),
      AES_ENCRYPT(p_contact_no, v_key),
      1
    );
  ELSE
    -- No encryption
    INSERT INTO collector (
      username, password_hash, first_name, last_name,
      email, contact_no, date_created, status
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name,
      p_email, p_contact_no, NOW(), 'active'
    );
  END IF;
  
  SET v_collector_id = LAST_INSERT_ID();
  SELECT v_collector_id as collector_id;
END$$
DELIMITER ;

-- =============================================
-- SECTION 4: Fix sp_createInspectorDirect to handle encryption
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
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  -- Create masked names
  IF p_first_name IS NOT NULL AND LENGTH(p_first_name) > 4 THEN
    SET v_masked_first = CONCAT(LEFT(p_first_name, 2), '***', RIGHT(p_first_name, 2));
  ELSE
    SET v_masked_first = p_first_name;
  END IF;
  
  IF p_last_name IS NOT NULL AND LENGTH(p_last_name) > 4 THEN
    SET v_masked_last = CONCAT(LEFT(p_last_name, 2), '***', RIGHT(p_last_name, 2));
  ELSE
    SET v_masked_last = p_last_name;
  END IF;
  
  IF v_key IS NOT NULL THEN
    INSERT INTO inspector (
      username, password,
      first_name, last_name,
      email, contact_no,
      date_hired, status,
      encrypted_first_name, encrypted_last_name, encrypted_contact,
      is_encrypted
    )
    VALUES (
      p_username, p_password_hash,
      v_masked_first, v_masked_last,
      p_email, p_contact_no,
      CURDATE(), 'active',
      AES_ENCRYPT(p_first_name, v_key),
      AES_ENCRYPT(p_last_name, v_key),
      AES_ENCRYPT(p_contact_no, v_key),
      1
    );
  ELSE
    INSERT INTO inspector (
      username, password, first_name, last_name,
      email, contact_no, date_hired, status
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name,
      p_email, p_contact_no, CURDATE(), 'active'
    );
  END IF;
  
  SET v_inspector_id = LAST_INSERT_ID();
  SELECT v_inspector_id as inspector_id;
END$$
DELIMITER ;

-- =============================================
-- SECTION 5: Encrypt existing inspector/collector data
-- =============================================
SET @encryption_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

SET SQL_SAFE_UPDATES = 0;

-- Encrypt existing inspector data
UPDATE inspector 
SET encrypted_first_name = AES_ENCRYPT(first_name, @encryption_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @encryption_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @encryption_key),
    is_encrypted = 1
WHERE first_name IS NOT NULL 
AND first_name NOT LIKE '%***%'
AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' inspector records') as result;

-- Mask inspector plaintext
UPDATE inspector 
SET first_name = CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2)),
    last_name = CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2))
WHERE first_name IS NOT NULL 
AND first_name NOT LIKE '%***%'
AND is_encrypted = 1;

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' inspector records') as result;

-- Encrypt existing collector data
UPDATE collector 
SET encrypted_first_name = AES_ENCRYPT(first_name, @encryption_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @encryption_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @encryption_key),
    is_encrypted = 1
WHERE first_name IS NOT NULL 
AND first_name NOT LIKE '%***%'
AND (is_encrypted = 0 OR is_encrypted IS NULL);

SELECT CONCAT('✅ Encrypted ', ROW_COUNT(), ' collector records') as result;

-- Mask collector plaintext
UPDATE collector 
SET first_name = CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2)),
    last_name = CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2))
WHERE first_name IS NOT NULL 
AND first_name NOT LIKE '%***%'
AND is_encrypted = 1;

SELECT CONCAT('✅ Masked ', ROW_COUNT(), ' collector records') as result;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- SECTION 6: Update mobile decryption procedures
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
        i.email,
        i.password as password_hash,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
            ELSE i.contact_no 
        END as contact_no,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.username = p_username COLLATE utf8mb4_general_ci 
    AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

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
        c.email,
        c.password_hash,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
            ELSE c.contact_no 
        END as contact_no,
        c.status,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username COLLATE utf8mb4_general_ci 
    AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

-- =============================================
-- 7. Verify
-- =============================================
SELECT 'Verifying...' as step;

SELECT COLUMN_NAME FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' 
AND COLUMN_NAME IN ('encrypted_first_name', 'encrypted_last_name', 'encrypted_contact', 'is_encrypted');

SELECT COLUMN_NAME FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' 
AND COLUMN_NAME IN ('encrypted_first_name', 'encrypted_last_name', 'encrypted_contact', 'is_encrypted');

SELECT '✅ Migration 428 complete!' as status;
