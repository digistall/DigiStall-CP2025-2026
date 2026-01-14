-- =============================================
-- 432: FIX ALL ENCRYPTION ISSUES
-- Fixes:
-- 1. Inspector encrypted_phone and encrypted_email NULL values
-- 2. Collector encrypted_email and encrypted_phone NULL values
-- 3. Decryption procedures for employee management (inspector/collector email)
-- 4. Mobile login decryption support
-- =============================================

-- Get the encryption key
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

SELECT CONCAT('Encryption key: ', IF(@enc_key IS NOT NULL, 'FOUND', 'NOT FOUND')) as status;

-- =============================================
-- PART 1: Add missing encrypted columns if they don't exist
-- =============================================

-- Add encrypted_email to inspector if missing
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'encrypted_email') = 0,
    'ALTER TABLE inspector ADD COLUMN encrypted_email VARBINARY(512) NULL AFTER encrypted_contact',
    'SELECT ''encrypted_email already exists in inspector'' as info'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add encrypted_phone to inspector if missing (as alias for encrypted_contact)
-- Note: inspector table uses encrypted_contact, not encrypted_phone

-- Add encrypted_email to collector if missing
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'encrypted_email') = 0,
    'ALTER TABLE collector ADD COLUMN encrypted_email VARBINARY(512) NULL AFTER encrypted_contact',
    'SELECT ''encrypted_email already exists in collector'' as info'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add encrypted_phone to collector if missing (as alias for encrypted_contact)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'encrypted_phone') = 0,
    'ALTER TABLE collector ADD COLUMN encrypted_phone VARBINARY(512) NULL AFTER encrypted_email',
    'SELECT ''encrypted_phone already exists in collector'' as info'));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =============================================
-- PART 2: Fix INSPECTOR table - encrypt missing data
-- =============================================

-- Encrypt inspector data where encrypted fields are NULL but plain fields have data
-- NOTE: If encrypted_* columns already have BLOB data, they won't be overwritten
UPDATE inspector 
SET 
    encrypted_first_name = CASE 
        WHEN encrypted_first_name IS NULL AND first_name IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(first_name, @enc_key) 
        ELSE encrypted_first_name 
    END,
    encrypted_last_name = CASE 
        WHEN encrypted_last_name IS NULL AND last_name IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(last_name, @enc_key) 
        ELSE encrypted_last_name 
    END,
    encrypted_contact = CASE 
        WHEN encrypted_contact IS NULL AND contact_no IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(contact_no, @enc_key) 
        ELSE encrypted_contact 
    END,
    encrypted_phone = CASE 
        WHEN encrypted_phone IS NULL AND contact_no IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(contact_no, @enc_key) 
        ELSE encrypted_phone 
    END,
    encrypted_email = CASE 
        WHEN encrypted_email IS NULL AND email IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(email, @enc_key) 
        ELSE encrypted_email 
    END,
    is_encrypted = CASE 
        WHEN @enc_key IS NOT NULL THEN 1 
        ELSE COALESCE(is_encrypted, 0) 
    END
WHERE inspector_id > 0;

SELECT CONCAT('✅ Updated ', ROW_COUNT(), ' inspector records with encryption') as status;

-- =============================================
-- PART 3: Fix COLLECTOR table - encrypt missing data
-- =============================================

-- Encrypt collector data where encrypted fields are NULL but plain fields have data
UPDATE collector 
SET 
    encrypted_first_name = CASE 
        WHEN encrypted_first_name IS NULL AND first_name IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(first_name, @enc_key) 
        ELSE encrypted_first_name 
    END,
    encrypted_last_name = CASE 
        WHEN encrypted_last_name IS NULL AND last_name IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(last_name, @enc_key) 
        ELSE encrypted_last_name 
    END,
    encrypted_contact = CASE 
        WHEN encrypted_contact IS NULL AND contact_no IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(contact_no, @enc_key) 
        ELSE encrypted_contact 
    END,
    encrypted_email = CASE 
        WHEN encrypted_email IS NULL AND email IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(email, @enc_key) 
        ELSE encrypted_email 
    END,
    encrypted_phone = CASE 
        WHEN encrypted_phone IS NULL AND contact_no IS NOT NULL AND @enc_key IS NOT NULL 
        THEN AES_ENCRYPT(contact_no, @enc_key) 
        ELSE encrypted_phone 
    END,
    is_encrypted = CASE 
        WHEN @enc_key IS NOT NULL THEN 1 
        ELSE COALESCE(is_encrypted, 0) 
    END
WHERE collector_id > 0;

SELECT CONCAT('✅ Updated ', ROW_COUNT(), ' collector records with encryption') as status;

-- =============================================
-- PART 4: Fix sp_getInspectorsAllDecrypted - Include email decryption
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getInspectorsAllDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.first_name, '') 
    END as first_name,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.last_name, '') 
    END as last_name,
    -- Decrypt email
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(i.email, '') 
    END as email,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(i.contact_no, '') 
    END as contact_no,
    i.status,
    i.date_hired,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id;
END$$

-- =============================================
-- PART 5: Fix sp_getInspectorsByBranchDecrypted - Include email decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getInspectorsByBranchDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.first_name, '') 
    END as first_name,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.last_name, '') 
    END as last_name,
    i.middle_name,
    -- Decrypt email
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(i.email, '') 
    END as email,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(i.contact_no, '') 
    END as contact_no,
    i.date_hired,
    i.status,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id
  WHERE ia.branch_id = p_branch_id
  ORDER BY i.date_hired DESC;
END$$

-- =============================================
-- PART 6: Fix sp_getCollectorsAllDecrypted - Include email decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorsAllDecrypted`$$

CREATE PROCEDURE `sp_getCollectorsAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id,
    c.username,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.first_name, '') 
    END as first_name,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.last_name, '') 
    END as last_name,
    -- Decrypt email
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(c.email, '') 
    END as email,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(c.contact_no, '') 
    END as contact_no,
    c.status,
    c.date_hired,
    c.last_login,
    c.last_logout,
    ca.branch_id,
    b.branch_name
  FROM collector c
  LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ca.branch_id = b.branch_id;
END$$

-- =============================================
-- PART 7: Fix sp_getCollectorsByBranchDecrypted - Include email decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorsByBranchDecrypted`$$

CREATE PROCEDURE `sp_getCollectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id,
    c.username,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.first_name, '') 
    END as first_name,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.last_name, '') 
    END as last_name,
    c.middle_name,
    -- Decrypt email
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(c.email, '') 
    END as email,
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(c.contact_no, '') 
    END as contact_no,
    c.date_hired,
    c.status,
    c.last_login,
    c.last_logout,
    ca.branch_id,
    b.branch_name
  FROM collector c
  LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ca.branch_id = b.branch_id
  WHERE ca.branch_id = p_branch_id
  ORDER BY c.date_hired DESC;
END$$

-- =============================================
-- PART 8: Fix sp_getInspectorByUsername for mobile login - decrypt all fields
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`$$

CREATE PROCEDURE `sp_getInspectorByUsername`(IN p_username VARCHAR(50))
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id as staff_id,
    i.inspector_id,
    i.username,
    i.password_hash,
    -- Decrypt first_name
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.first_name, '') 
    END as first_name,
    -- Decrypt last_name
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.last_name, '') 
    END as last_name,
    i.middle_name,
    -- Decrypt email
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(i.email, '') 
    END as email,
    -- Decrypt contact
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(i.contact_no, '') 
    END as contact_no,
    i.status,
    i.date_hired,
    i.last_login,
    i.last_logout,
    -- Return 0 because we've already decrypted the data
    0 as is_encrypted,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id
  WHERE i.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
  AND i.status COLLATE utf8mb4_general_ci = 'active' COLLATE utf8mb4_general_ci
  LIMIT 1;
END$$

-- =============================================
-- PART 9: Fix sp_getCollectorByUsername for mobile login - decrypt all fields
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`$$

CREATE PROCEDURE `sp_getCollectorByUsername`(IN p_username VARCHAR(50))
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id as staff_id,
    c.collector_id,
    c.username,
    c.password_hash,
    -- Decrypt first_name
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.first_name, '') 
    END as first_name,
    -- Decrypt last_name
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.last_name, '') 
    END as last_name,
    c.middle_name,
    -- Decrypt email
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(c.email, '') 
    END as email,
    -- Decrypt contact
    CASE 
      WHEN COALESCE(c.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND c.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(c.contact_no, '') 
    END as contact_no,
    c.status,
    c.date_hired,
    c.last_login,
    c.last_logout,
    -- Return 0 because we've already decrypted the data
    0 as is_encrypted,
    ca.branch_id,
    b.branch_name
  FROM collector c
  LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
  LEFT JOIN branch b ON ca.branch_id = b.branch_id
  WHERE c.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
  AND c.status COLLATE utf8mb4_general_ci = 'active' COLLATE utf8mb4_general_ci
  LIMIT 1;
END$$

-- =============================================
-- PART 10: Fix sp_createInspectorDirect - encrypt email
-- =============================================

DROP PROCEDURE IF EXISTS `sp_createInspectorDirect`$$

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
  
  -- Create masked versions of names for display
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
      username, password_hash, 
      first_name, last_name,
      email, contact_no, 
      date_hired, status,
      encrypted_first_name, encrypted_last_name, encrypted_contact, encrypted_email,
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
      AES_ENCRYPT(p_email, v_key),
      1
    );
  ELSE
    INSERT INTO inspector (
      username, password_hash, first_name, last_name,
      email, contact_no, date_hired, status, is_encrypted
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name,
      p_email, p_contact_no, CURDATE(), 'active', 0
    );
  END IF;
  
  SET v_inspector_id = LAST_INSERT_ID();
  SELECT v_inspector_id as inspector_id;
END$$

-- =============================================
-- PART 11: Fix sp_createCollectorDirect - encrypt email
-- =============================================

DROP PROCEDURE IF EXISTS `sp_createCollectorDirect`$$

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
  
  -- Create masked versions of names for display
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
    INSERT INTO collector (
      username, password_hash, 
      first_name, last_name,
      email, contact_no, 
      date_created, status,
      encrypted_first_name, encrypted_last_name, encrypted_contact, encrypted_email, encrypted_phone,
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
      AES_ENCRYPT(p_email, v_key),
      AES_ENCRYPT(p_contact_no, v_key),
      1
    );
  ELSE
    INSERT INTO collector (
      username, password_hash, first_name, last_name,
      email, contact_no, date_created, status, is_encrypted
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name,
      p_email, p_contact_no, NOW(), 'active', 0
    );
  END IF;
  
  SET v_collector_id = LAST_INSERT_ID();
  SELECT v_collector_id as collector_id;
END$$

-- =============================================
-- PART 12: Fix getAllComplianceRecordsDecrypted - Safe version
-- =============================================

DROP PROCEDURE IF EXISTS `getAllComplianceRecordsDecrypted`$$

CREATE PROCEDURE `getAllComplianceRecordsDecrypted` (
    IN `p_branch_id` INT, 
    IN `p_status` VARCHAR(20), 
    IN `p_search` VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        vr.report_id AS compliance_id,
        vr.date_reported AS date,
        COALESCE(vr.compliance_type, v.violation_type) AS type,
        -- Inspector name - check if encrypted columns exist
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                CONCAT(
                    CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100)), 
                    ' ', 
                    CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
                )
            ELSE CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, '')) 
        END AS inspector,
        -- Stallholder name
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE COALESCE(sh.stallholder_name, '') 
        END AS stallholder,
        vr.status AS status,
        vr.severity AS severity,
        vr.remarks AS notes,
        vr.resolved_date AS resolved_date,
        b.branch_name AS branch_name,
        b.branch_id AS branch_id,
        COALESCE(s.stall_no, '') AS stall_no,
        COALESCE(vr.offense_no, 1) AS offense_no,
        COALESCE(vp.penalty_amount, 0) AS penalty_amount,
        vr.stallholder_id AS stallholder_id,
        vr.stall_id AS stall_id,
        vr.inspector_id AS inspector_id,
        vr.violation_id AS violation_id,
        vr.evidence AS evidence,
        vr.receipt_number AS receipt_number,
        vr.payment_date AS payment_date,
        vr.payment_reference AS payment_reference,
        vr.paid_amount AS paid_amount,
        vr.collected_by AS collected_by,
        v.ordinance_no AS ordinance_no,
        v.details AS violation_details,
        vp.remarks AS penalty_remarks,
        COALESCE(sh.compliance_status, 'unknown') AS stallholder_compliance_status,
        -- Stallholder contact
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(sh.contact_number, '') 
        END AS stallholder_contact,
        -- Stallholder email
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
            ELSE COALESCE(sh.email, '') 
        END AS stallholder_email
    FROM violation_report vr
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    WHERE 
        (p_branch_id IS NULL OR vr.branch_id = p_branch_id)
        AND (p_status IS NULL OR p_status COLLATE utf8mb4_general_ci = 'all' OR vr.status COLLATE utf8mb4_general_ci = p_status COLLATE utf8mb4_general_ci)
        AND (
            p_search IS NULL OR p_search = '' OR
            CAST(vr.report_id AS CHAR) LIKE CONCAT('%', p_search, '%') OR
            COALESCE(vr.compliance_type, v.violation_type, '') LIKE CONCAT('%', p_search, '%') OR
            CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, '')) LIKE CONCAT('%', p_search, '%') OR
            COALESCE(sh.stallholder_name, '') LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY vr.date_reported DESC;
END$$

DELIMITER ;

-- =============================================
-- PART 13: Verify the fixes
-- =============================================

SELECT '✅ Checking inspector table encryption status...' as step;
SELECT 
    inspector_id, 
    username,
    first_name,
    email,
    is_encrypted,
    encrypted_first_name IS NOT NULL as has_enc_first,
    encrypted_email IS NOT NULL as has_enc_email
FROM inspector;

SELECT '✅ Checking collector table encryption status...' as step;
SELECT 
    collector_id, 
    username,
    first_name,
    email,
    is_encrypted,
    encrypted_first_name IS NOT NULL as has_enc_first,
    encrypted_email IS NOT NULL as has_enc_email
FROM collector;

SELECT '✅ Migration 432 complete! All encryption issues fixed.' as status;
SELECT 'Please restart your backend servers for the changes to take effect.' as note;