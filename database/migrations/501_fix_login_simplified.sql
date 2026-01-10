-- =============================================
-- Migration 501: Fix Inspector/Collector Login & Encryption (Simplified)
-- Date: 2026-01-10
-- Description: Fixes login issues and adds proper encryption
-- =============================================

-- =============================================
-- SECTION 1: Add missing encryption columns (ignore errors if exists)
-- =============================================

-- Inspector table columns - run each and ignore "Duplicate column name" errors
-- ALTER TABLE inspector ADD COLUMN encrypted_first_name VARBINARY(512) DEFAULT NULL;
-- ALTER TABLE inspector ADD COLUMN encrypted_last_name VARBINARY(512) DEFAULT NULL;
-- ALTER TABLE inspector ADD COLUMN encrypted_contact VARBINARY(256) DEFAULT NULL;
-- ALTER TABLE inspector ADD COLUMN encrypted_email VARBINARY(256) DEFAULT NULL;
-- ALTER TABLE inspector ADD COLUMN is_encrypted TINYINT DEFAULT 0;

-- Collector table columns
-- ALTER TABLE collector ADD COLUMN encrypted_first_name VARBINARY(512) DEFAULT NULL;
-- ALTER TABLE collector ADD COLUMN encrypted_last_name VARBINARY(512) DEFAULT NULL;
-- ALTER TABLE collector ADD COLUMN encrypted_contact VARBINARY(256) DEFAULT NULL;
-- ALTER TABLE collector ADD COLUMN encrypted_email VARBINARY(256) DEFAULT NULL;
-- ALTER TABLE collector ADD COLUMN is_encrypted TINYINT DEFAULT 0;

-- =============================================
-- SECTION 2: Fix sp_getInspectorByUsername for login
-- Key fix: inspector table uses 'password' column not 'password_hash'
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
        -- Decrypt first_name if encrypted
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE i.first_name 
        END as first_name,
        -- Decrypt last_name if encrypted
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE i.last_name 
        END as last_name,
        i.middle_name,
        -- Decrypt email if encrypted
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
            ELSE i.email 
        END as email,
        -- IMPORTANT: Inspector table uses 'password' column for bcrypt hash
        -- Also check 'password_hash' column for newer records
        COALESCE(NULLIF(i.password_hash, ''), i.password) as password_hash,
        -- Decrypt contact if encrypted
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
        COALESCE(i.is_encrypted, 0) as is_encrypted
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (i.username = p_username COLLATE utf8mb4_general_ci OR i.email = p_username COLLATE utf8mb4_general_ci)
    AND i.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

SELECT '✅ sp_getInspectorByUsername fixed' as status;

-- =============================================
-- SECTION 3: Fix sp_getCollectorByUsername for login
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
        -- Decrypt first_name if encrypted
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE c.first_name 
        END as first_name,
        -- Decrypt last_name if encrypted
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE c.last_name 
        END as last_name,
        c.middle_name,
        -- Decrypt email if encrypted
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
            ELSE c.email 
        END as email,
        c.password_hash,
        -- Decrypt contact if encrypted
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
        COALESCE(c.is_encrypted, 0) as is_encrypted
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (c.username = p_username COLLATE utf8mb4_general_ci OR c.email = p_username COLLATE utf8mb4_general_ci)
    AND c.status = 'active'
    LIMIT 1;
END$$
DELIMITER ;

SELECT '✅ sp_getCollectorByUsername fixed' as status;

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

SELECT '✅ sp_createInspectorDirect fixed with encryption' as status;

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

SELECT '✅ sp_createCollectorDirect fixed with encryption' as status;

-- =============================================
-- SECTION 6: Test the stored procedures
-- =============================================
SELECT '-- Testing stored procedures --' as test;

-- Test inspector lookup (should return data for INS1731)
CALL sp_getInspectorByUsername('INS1731');

-- Test collector lookup (should return data for COL3126)
CALL sp_getCollectorByUsername('COL3126');

SELECT '✅ Migration 501 Complete!' as final_status;
