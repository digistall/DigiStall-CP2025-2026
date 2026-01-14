-- =============================================
-- 505: Encrypt Inspector & Collector Data (Applicant Pattern)
-- Same encryption method as applicant table
-- Stores encrypted data in main columns (first_name, last_name, email, contact_no)
-- Uses AES_ENCRYPT with encryption_keys table
-- Created: 2026-01-10
-- =============================================

DELIMITER $$

-- =============================================
-- STEP 1: Encrypt existing Inspector data
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptInspectorData$$
CREATE PROCEDURE sp_encryptInspectorData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_first_name VARCHAR(255);
  DECLARE v_last_name VARCHAR(255);
  DECLARE v_email VARCHAR(500);
  DECLARE v_contact VARCHAR(255);
  DECLARE v_key VARBINARY(64);
  
  DECLARE cur CURSOR FOR 
    SELECT inspector_id, first_name, last_name, email, contact_no
    FROM inspector 
    WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_first_name, v_last_name, v_email, v_contact;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Encrypt data directly into main columns (like applicant table)
    UPDATE inspector 
    SET 
      -- Store encrypted data in main columns
      first_name = AES_ENCRYPT(v_first_name, v_key),
      last_name = AES_ENCRYPT(v_last_name, v_key),
      email = AES_ENCRYPT(v_email, v_key),
      contact_no = CASE 
        WHEN v_contact IS NOT NULL AND v_contact != '' 
        THEN AES_ENCRYPT(v_contact, v_key)
        ELSE NULL 
      END,
      -- Set encrypted_* columns to encrypted data as well for consistency
      encrypted_first_name = AES_ENCRYPT(v_first_name, v_key),
      encrypted_last_name = AES_ENCRYPT(v_last_name, v_key),
      encrypted_email = AES_ENCRYPT(v_email, v_key),
      encrypted_contact = CASE 
        WHEN v_contact IS NOT NULL AND v_contact != '' 
        THEN AES_ENCRYPT(v_contact, v_key)
        ELSE NULL 
      END,
      is_encrypted = 1
    WHERE inspector_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' inspector records') as status;
END$$

-- =============================================
-- STEP 2: Encrypt existing Collector data
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptCollectorData$$
CREATE PROCEDURE sp_encryptCollectorData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_first_name VARCHAR(255);
  DECLARE v_last_name VARCHAR(255);
  DECLARE v_email VARCHAR(500);
  DECLARE v_contact VARCHAR(255);
  DECLARE v_key VARBINARY(64);
  
  DECLARE cur CURSOR FOR 
    SELECT collector_id, first_name, last_name, email, contact_no
    FROM collector 
    WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  -- Get encryption key
  SELECT encryption_key INTO v_key 
  FROM encryption_keys 
  WHERE key_name = 'user_data_key' AND is_active = 1 
  LIMIT 1;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_first_name, v_last_name, v_email, v_contact;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    -- Encrypt data directly into main columns (like applicant table)
    UPDATE collector 
    SET 
      -- Store encrypted data in main columns
      first_name = AES_ENCRYPT(v_first_name, v_key),
      last_name = AES_ENCRYPT(v_last_name, v_key),
      email = AES_ENCRYPT(v_email, v_key),
      contact_no = CASE 
        WHEN v_contact IS NOT NULL AND v_contact != '' 
        THEN AES_ENCRYPT(v_contact, v_key)
        ELSE NULL 
      END,
      -- Set encrypted_* columns to encrypted data as well for consistency
      encrypted_first_name = AES_ENCRYPT(v_first_name, v_key),
      encrypted_last_name = AES_ENCRYPT(v_last_name, v_key),
      encrypted_email = AES_ENCRYPT(v_email, v_key),
      encrypted_contact = CASE 
        WHEN v_contact IS NOT NULL AND v_contact != '' 
        THEN AES_ENCRYPT(v_contact, v_key)
        ELSE NULL 
      END,
      is_encrypted = 1
    WHERE collector_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' collector records') as status;
END$$

-- =============================================
-- STEP 3: Update sp_getInspectorByUsername with decryption
-- =============================================
DROP PROCEDURE IF EXISTS sp_getInspectorByUsername$$
CREATE PROCEDURE sp_getInspectorByUsername(
    IN p_username VARCHAR(50)
)
BEGIN
    DECLARE v_key VARBINARY(64);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        i.password as password_hash,
        -- Decrypt data on retrieval (like applicant table)
        CASE 
            WHEN i.is_encrypted = 1 THEN CAST(AES_DECRYPT(i.first_name, v_key) AS CHAR)
            ELSE i.first_name 
        END as first_name,
        CASE 
            WHEN i.is_encrypted = 1 THEN CAST(AES_DECRYPT(i.last_name, v_key) AS CHAR)
            ELSE i.last_name 
        END as last_name,
        i.middle_name,
        CASE 
            WHEN i.is_encrypted = 1 THEN CAST(AES_DECRYPT(i.email, v_key) AS CHAR)
            ELSE i.email 
        END as email,
        CASE 
            WHEN i.is_encrypted = 1 AND i.contact_no IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.contact_no, v_key) AS CHAR)
            ELSE i.contact_no 
        END as contact_no,
        i.date_hired,
        i.status,
        i.termination_date,
        i.termination_reason,
        i.last_login,
        i.last_logout,
        i.branch_id,
        b.branch_name,
        b.location
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.username = p_username COLLATE utf8mb4_general_ci 
       OR i.email = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$

-- =============================================
-- STEP 4: Update sp_getCollectorByUsername with decryption
-- =============================================
DROP PROCEDURE IF EXISTS sp_getCollectorByUsername$$
CREATE PROCEDURE sp_getCollectorByUsername(
    IN p_username VARCHAR(50)
)
BEGIN
    DECLARE v_key VARBINARY(64);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        -- Decrypt data on retrieval (like applicant table)
        CASE 
            WHEN c.is_encrypted = 1 THEN CAST(AES_DECRYPT(c.first_name, v_key) AS CHAR)
            ELSE c.first_name 
        END as first_name,
        CASE 
            WHEN c.is_encrypted = 1 THEN CAST(AES_DECRYPT(c.last_name, v_key) AS CHAR)
            ELSE c.last_name 
        END as last_name,
        c.middle_name,
        CASE 
            WHEN c.is_encrypted = 1 THEN CAST(AES_DECRYPT(c.email, v_key) AS CHAR)
            ELSE c.email 
        END as email,
        CASE 
            WHEN c.is_encrypted = 1 AND c.contact_no IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.contact_no, v_key) AS CHAR)
            ELSE c.contact_no 
        END as contact_no,
        c.date_hired,
        c.status,
        c.termination_date,
        c.termination_reason,
        c.last_login,
        c.last_logout,
        ca.branch_id,
        b.branch_name,
        b.location
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username COLLATE utf8mb4_general_ci 
       OR c.email = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$

-- =============================================
-- STEP 5: Update sp_createInspectorDirect with auto-encryption
-- =============================================
DROP PROCEDURE IF EXISTS sp_createInspectorDirect$$
CREATE PROCEDURE sp_createInspectorDirect(
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
    DECLARE v_key VARBINARY(64);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    -- Insert with encrypted data (like applicant table)
    INSERT INTO inspector (
        username, 
        password,
        first_name, 
        last_name, 
        middle_name, 
        email, 
        contact_no,
        encrypted_first_name,
        encrypted_last_name,
        encrypted_email,
        encrypted_contact,
        branch_id,
        date_hired,
        status,
        is_encrypted
    ) VALUES (
        p_username,
        p_password_hash,
        AES_ENCRYPT(p_first_name, v_key),
        AES_ENCRYPT(p_last_name, v_key),
        p_middle_name,
        AES_ENCRYPT(p_email, v_key),
        CASE 
            WHEN p_contact_no IS NOT NULL AND p_contact_no != '' 
            THEN AES_ENCRYPT(p_contact_no, v_key)
            ELSE NULL 
        END,
        AES_ENCRYPT(p_first_name, v_key),
        AES_ENCRYPT(p_last_name, v_key),
        AES_ENCRYPT(p_email, v_key),
        CASE 
            WHEN p_contact_no IS NOT NULL AND p_contact_no != '' 
            THEN AES_ENCRYPT(p_contact_no, v_key)
            ELSE NULL 
        END,
        p_branch_id,
        CURDATE(),
        'active',
        1
    );
    
    SELECT LAST_INSERT_ID() as inspector_id;
END$$

-- =============================================
-- STEP 6: Update sp_createCollectorDirect with auto-encryption
-- =============================================
DROP PROCEDURE IF EXISTS sp_createCollectorDirect$$
CREATE PROCEDURE sp_createCollectorDirect(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(255),
    IN p_last_name VARCHAR(255),
    IN p_middle_name VARCHAR(100),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(255)
)
BEGIN
    DECLARE v_key VARBINARY(64);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    -- Insert with encrypted data (like applicant table)
    INSERT INTO collector (
        username,
        password_hash,
        first_name,
        last_name,
        middle_name,
        email,
        contact_no,
        encrypted_first_name,
        encrypted_last_name,
        encrypted_email,
        encrypted_contact,
        date_hired,
        status,
        is_encrypted
    ) VALUES (
        p_username,
        p_password_hash,
        AES_ENCRYPT(p_first_name, v_key),
        AES_ENCRYPT(p_last_name, v_key),
        p_middle_name,
        AES_ENCRYPT(p_email, v_key),
        CASE 
            WHEN p_contact_no IS NOT NULL AND p_contact_no != '' 
            THEN AES_ENCRYPT(p_contact_no, v_key)
            ELSE NULL 
        END,
        AES_ENCRYPT(p_first_name, v_key),
        AES_ENCRYPT(p_last_name, v_key),
        AES_ENCRYPT(p_email, v_key),
        CASE 
            WHEN p_contact_no IS NOT NULL AND p_contact_no != '' 
            THEN AES_ENCRYPT(p_contact_no, v_key)
            ELSE NULL 
        END,
        CURDATE(),
        'active',
        1
    );
    
    SELECT LAST_INSERT_ID() as collector_id;
END$$

DELIMITER ;

-- =============================================
-- STEP 7: Execute encryption procedures
-- =============================================

-- Encrypt inspector data
CALL sp_encryptInspectorData();

-- Encrypt collector data
CALL sp_encryptCollectorData();

-- =============================================
-- STEP 8: Verify encryption worked
-- =============================================
SELECT 'Inspector Data:' as verification;
SELECT 
    inspector_id,
    username,
    first_name as encrypted_first_name_binary,
    last_name as encrypted_last_name_binary,
    email as encrypted_email_binary,
    is_encrypted
FROM inspector 
LIMIT 5;

SELECT 'Collector Data:' as verification;
SELECT 
    collector_id,
    username,
    first_name as encrypted_first_name_binary,
    last_name as encrypted_last_name_binary,
    email as encrypted_email_binary,
    is_encrypted
FROM collector 
LIMIT 5;

-- =============================================
-- STEP 9: Test decryption with stored procedures
-- =============================================
SELECT 'Testing Inspector Decryption:' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT 'Testing Collector Decryption:' as test;
CALL sp_getCollectorByUsername('COL3126');

-- =============================================
-- DONE! 
-- =============================================
-- Migration 505 Complete!
-- - Inspector and Collector data encrypted in main columns (first_name, last_name, email, contact_no)
-- - Same as applicant table pattern
-- - Stored procedures decrypt on retrieval
-- - New records auto-encrypt on insert
-- =============================================
