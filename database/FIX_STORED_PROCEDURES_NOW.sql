-- =============================================
-- EMERGENCY FIX - Update Stored Procedures NOW
-- This will fix the mobile login to show real names
-- =============================================

USE naga_stall;

DELIMITER $$

-- =============================================
-- FIX 1: sp_getInspectorByUsername - Return decrypted data
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`$$

CREATE PROCEDURE `sp_getInspectorByUsername`(IN `p_username` VARCHAR(50))
BEGIN
  DECLARE v_key VARCHAR(64);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name COLLATE utf8mb4_general_ci = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  -- Return inspector with DECRYPTED data
  SELECT 
    i.inspector_id as staff_id,
    i.inspector_id,
    i.username,
    -- DECRYPT first_name from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.first_name, '') 
    END as first_name,
    -- DECRYPT last_name from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.last_name, '') 
    END as last_name,
    i.middle_name,
    -- DECRYPT email from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND i.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(i.email, '') 
    END as email,
    -- DECRYPT contact_no from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      WHEN v_key IS NOT NULL AND i.encrypted_phone IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_phone, v_key) AS CHAR(50))
      ELSE COALESCE(i.contact_no, '') 
    END as contact_no,
    i.password as password_hash,
    i.status,
    i.last_login,
    0 as is_encrypted  -- CRITICAL: Set to 0 to prevent Node.js double-decryption
  FROM inspector i
  WHERE i.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
  LIMIT 1;
END$$

-- =============================================
-- FIX 2: sp_getCollectorByUsername - Return decrypted data
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`$$

CREATE PROCEDURE `sp_getCollectorByUsername`(IN `p_username` VARCHAR(50))
BEGIN
  DECLARE v_key VARCHAR(64);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name COLLATE utf8mb4_general_ci = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  -- Return collector with DECRYPTED data
  SELECT 
    c.collector_id as staff_id,
    c.collector_id,
    c.username,
    -- DECRYPT first_name from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND c.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.first_name, '') 
    END as first_name,
    -- DECRYPT last_name from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND c.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(c.last_name, '') 
    END as last_name,
    c.middle_name,
    -- DECRYPT email from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND c.encrypted_email IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
      ELSE COALESCE(c.email, '') 
    END as email,
    -- DECRYPT contact_no from encrypted BLOB
    CASE 
      WHEN v_key IS NOT NULL AND c.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
      WHEN v_key IS NOT NULL AND c.encrypted_phone IS NOT NULL THEN 
        CAST(AES_DECRYPT(c.encrypted_phone, v_key) AS CHAR(50))
      ELSE COALESCE(c.contact_no, '') 
    END as contact_no,
    c.password_hash,
    c.status,
    c.date_created,
    c.last_login,
    0 as is_encrypted  -- CRITICAL: Set to 0 to prevent Node.js double-decryption
  FROM collector c
  WHERE c.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
  LIMIT 1;
END$$

DELIMITER ;

-- =============================================
-- VERIFY THE FIX
-- =============================================

-- Test the procedures
SELECT '===== TESTING sp_getInspectorByUsername =====' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT '===== TESTING sp_getCollectorByUsername =====' as test;
CALL sp_getCollectorByUsername('CO_3126');

SELECT '✅ FIXED! Check above - first_name should be "Jonas", not "Jo***as"' as status;
SELECT 'Now restart your backend servers and test the mobile app login.' as next_step;
