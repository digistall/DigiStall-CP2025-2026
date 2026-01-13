-- =============================================
-- 429B: QUICK FIX - Restore Web Login + Mobile Decryption
-- Run this to fix login immediately
-- =============================================

-- =============================================
-- FIX 1: sp_getBusinessManagerByUsername (Web Manager Login)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getBusinessManagerByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getBusinessManagerByUsername`(IN p_username VARCHAR(100))
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        bm.business_manager_id,
        bm.branch_id,
        bm.manager_username,
        bm.manager_password_hash,
        CASE 
            WHEN bm.is_encrypted = 1 AND bm.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(bm.encrypted_first_name, v_key) AS CHAR(100))
            ELSE bm.first_name 
        END as first_name,
        CASE 
            WHEN bm.is_encrypted = 1 AND bm.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(bm.encrypted_last_name, v_key) AS CHAR(100))
            ELSE bm.last_name 
        END as last_name,
        CASE 
            WHEN bm.is_encrypted = 1 AND bm.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(bm.encrypted_email, v_key) AS CHAR(255))
            ELSE bm.email 
        END as email,
        CASE 
            WHEN bm.is_encrypted = 1 AND bm.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(bm.encrypted_contact, v_key) AS CHAR(50))
            ELSE bm.contact_number 
        END as contact_number,
        bm.status
    FROM business_manager bm
    WHERE bm.manager_username = p_username;
END$$
DELIMITER ;

-- =============================================
-- FIX 2: sp_getBusinessEmployeeByUsername (Web Employee Login)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getBusinessEmployeeByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getBusinessEmployeeByUsername`(IN p_username VARCHAR(100))
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        e.business_employee_id,
        e.branch_id,
        e.employee_username,
        e.employee_password_hash,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_first_name, v_key) AS CHAR(100))
            ELSE e.first_name 
        END as first_name,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_last_name, v_key) AS CHAR(100))
            ELSE e.last_name 
        END as last_name,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_email, v_key) AS CHAR(255))
            ELSE e.email 
        END as email,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_contact IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_contact, v_key) AS CHAR(50))
            ELSE e.phone_number 
        END as phone_number,
        e.permissions,
        e.status
    FROM business_employee e
    WHERE e.employee_username = p_username;
END$$
DELIMITER ;

-- =============================================
-- FIX 3: sp_createCollectorDirect (Fix 500 error)
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
-- FIX 4: sp_createInspectorDirect
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

-- =============================================
-- FIX 5: Encrypt inspector data + update decryption
-- =============================================
SET @encryption_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);
SET SQL_SAFE_UPDATES = 0;

-- Encrypt inspector data (if not already)
UPDATE inspector 
SET encrypted_first_name = AES_ENCRYPT(first_name, @encryption_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @encryption_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @encryption_key),
    is_encrypted = 1
WHERE first_name IS NOT NULL 
AND first_name NOT LIKE '%***%'
AND (is_encrypted = 0 OR is_encrypted IS NULL);

-- Mask inspector names
UPDATE inspector 
SET first_name = CONCAT(LEFT(first_name, 2), '***', RIGHT(first_name, 2)),
    last_name = CONCAT(LEFT(last_name, 2), '***', RIGHT(last_name, 2))
WHERE first_name IS NOT NULL 
AND first_name NOT LIKE '%***%'
AND is_encrypted = 1;

SET SQL_SAFE_UPDATES = 1;

-- =============================================
-- FIX 6: sp_getInspectorByUsername (Mobile Login - DECRYPTS!)
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

-- =============================================
-- FIX 7: sp_getCollectorByUsername (Mobile Login - DECRYPTS!)
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

SELECT '✅ Quick fix complete! Web login + Mobile decryption fixed.' as status;
