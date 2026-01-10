-- =============================================
-- 430: EMERGENCY FIX - Remove encryption references for non-encrypted tables
-- business_manager and business_employee DON'T have encryption columns
-- =============================================

-- =============================================
-- FIX 1: sp_getBusinessManagerByUsername (NO encryption - table doesn't have columns)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getBusinessManagerByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getBusinessManagerByUsername`(IN p_username VARCHAR(100))
BEGIN
    SELECT 
        bm.business_manager_id,
        bm.branch_id,
        bm.manager_username,
        bm.manager_password_hash,
        bm.first_name,
        bm.last_name,
        bm.email,
        bm.contact_number,
        bm.status
    FROM business_manager bm
    WHERE bm.manager_username = p_username COLLATE utf8mb4_general_ci;
END$$
DELIMITER ;

-- =============================================
-- FIX 2: sp_getBusinessEmployeeByUsername (NO encryption - table doesn't have columns)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getBusinessEmployeeByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getBusinessEmployeeByUsername`(IN p_username VARCHAR(100))
BEGIN
    SELECT 
        e.business_employee_id,
        e.branch_id,
        e.employee_username,
        e.employee_password_hash,
        e.first_name,
        e.last_name,
        e.email,
        e.phone_number,
        e.permissions,
        e.status
    FROM business_employee e
    WHERE e.employee_username = p_username COLLATE utf8mb4_general_ci;
END$$
DELIMITER ;

-- =============================================
-- FIX 3: Check inspector table - verify encryption columns exist
-- =============================================
SELECT 'Checking inspector table columns...' as step;
SELECT COLUMN_NAME FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' 
AND COLUMN_NAME IN ('encrypted_first_name', 'is_encrypted');

-- =============================================
-- FIX 4: sp_getInspectorByUsername - Mobile decryption
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByUsername`(IN p_username VARCHAR(255))
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
            WHEN i.is_encrypted = 1 AND i.encrypted_first_name IS NOT NULL AND v_key IS NOT NULL
            THEN CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
            ELSE i.first_name 
        END as first_name,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_last_name IS NOT NULL AND v_key IS NOT NULL
            THEN CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            ELSE i.last_name 
        END as last_name,
        i.email,
        i.password as password_hash,
        CASE 
            WHEN i.is_encrypted = 1 AND i.encrypted_contact IS NOT NULL AND v_key IS NOT NULL
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

-- =============================================
-- FIX 5: sp_getCollectorByUsername - Mobile decryption  
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByUsername`(IN p_username VARCHAR(255))
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
            WHEN c.is_encrypted = 1 AND c.encrypted_first_name IS NOT NULL AND v_key IS NOT NULL
            THEN CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
            ELSE c.first_name 
        END as first_name,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_last_name IS NOT NULL AND v_key IS NOT NULL
            THEN CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
            ELSE c.last_name 
        END as last_name,
        c.email,
        c.password_hash,
        CASE 
            WHEN c.is_encrypted = 1 AND c.encrypted_contact IS NOT NULL AND v_key IS NOT NULL
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
-- FIX 6: Verify inspector has encrypted data properly stored
-- =============================================
SELECT 'Checking inspector encrypted data...' as step;
SELECT inspector_id, username, first_name, is_encrypted,
       CASE WHEN encrypted_first_name IS NOT NULL THEN 'HAS DATA' ELSE 'NULL' END as has_encrypted
FROM inspector LIMIT 5;

-- =============================================
-- FIX 7: Re-encrypt inspector if needed (data shows masked but not encrypted)
-- =============================================
SET @encryption_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);
SET SQL_SAFE_UPDATES = 0;

-- Check if inspector data is masked but encrypted columns are NULL
-- This would mean masking happened but encryption didn't
UPDATE inspector 
SET encrypted_first_name = NULL,
    encrypted_last_name = NULL, 
    encrypted_contact = NULL,
    is_encrypted = 0
WHERE is_encrypted = 1 
AND encrypted_first_name IS NULL;

SELECT CONCAT('Reset ', ROW_COUNT(), ' inspector records with missing encrypted data') as result;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- FIX 8: sp_createCollectorDirect 
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
  
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
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
-- FIX 9: sp_createInspectorDirect
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
  
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
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

SELECT '✅ Migration 430 complete! Web login fixed.' as status;
