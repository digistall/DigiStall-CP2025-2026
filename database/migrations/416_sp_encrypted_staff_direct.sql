-- Migration: 416_sp_encrypted_staff_direct.sql
-- Description: Update staff creation procedures to use encryption
-- MUST run AFTER 413 and 414 migrations
-- =============================================

DELIMITER $$

-- =============================================
-- 1. ENCRYPTED INSPECTOR CREATION (Direct)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_createInspectorDirect_Encrypted`$$

CREATE PROCEDURE `sp_createInspectorDirect_Encrypted`(
  IN p_username VARCHAR(50),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_contact_no VARCHAR(20)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_inspector_id INT;
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_phone VARCHAR(20);
  DECLARE v_full_name VARCHAR(255);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
  
  -- Create masked versions
  IF p_email IS NOT NULL AND LENGTH(p_email) > 4 THEN
    SET v_masked_email = CONCAT(LEFT(p_email, 2), '***@***.', RIGHT(p_email, 3));
  ELSE
    SET v_masked_email = p_email;
  END IF;
  
  IF p_contact_no IS NOT NULL AND LENGTH(p_contact_no) > 4 THEN
    SET v_masked_phone = CONCAT(LEFT(p_contact_no, 2), '****', RIGHT(p_contact_no, 2));
  ELSE
    SET v_masked_phone = p_contact_no;
  END IF;
  
  INSERT INTO inspector (
    username, password_hash, first_name, last_name, inspector_name,
    email, contact_no, date_created, status,
    encrypted_email, encrypted_phone, is_encrypted
  )
  VALUES (
    p_username, p_password_hash, p_first_name, p_last_name, v_full_name,
    v_masked_email, v_masked_phone, NOW(), 'active',
    AES_ENCRYPT(p_email, v_key),
    AES_ENCRYPT(p_contact_no, v_key),
    1
  );
  
  SET v_inspector_id = LAST_INSERT_ID();
  
  SELECT v_inspector_id as inspector_id;
END$$

-- =============================================
-- 2. ENCRYPTED COLLECTOR CREATION (Direct)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_createCollectorDirect_Encrypted`$$

CREATE PROCEDURE `sp_createCollectorDirect_Encrypted`(
  IN p_username VARCHAR(50),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password_hash VARCHAR(255),
  IN p_contact_no VARCHAR(20)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_collector_id INT;
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_phone VARCHAR(20);
  DECLARE v_full_name VARCHAR(255);
  
  -- Get encryption key
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
  
  -- Create masked versions
  IF p_email IS NOT NULL AND LENGTH(p_email) > 4 THEN
    SET v_masked_email = CONCAT(LEFT(p_email, 2), '***@***.', RIGHT(p_email, 3));
  ELSE
    SET v_masked_email = p_email;
  END IF;
  
  IF p_contact_no IS NOT NULL AND LENGTH(p_contact_no) > 4 THEN
    SET v_masked_phone = CONCAT(LEFT(p_contact_no, 2), '****', RIGHT(p_contact_no, 2));
  ELSE
    SET v_masked_phone = p_contact_no;
  END IF;
  
  INSERT INTO collector (
    username, password_hash, first_name, last_name, collector_name,
    email, contact_no, date_created, status,
    encrypted_email, encrypted_phone, is_encrypted
  )
  VALUES (
    p_username, p_password_hash, p_first_name, p_last_name, v_full_name,
    v_masked_email, v_masked_phone, NOW(), 'active',
    AES_ENCRYPT(p_email, v_key),
    AES_ENCRYPT(p_contact_no, v_key),
    1
  );
  
  SET v_collector_id = LAST_INSERT_ID();
  
  SELECT v_collector_id as collector_id;
END$$

-- =============================================
-- UPDATE ORIGINAL PROCEDURES TO USE ENCRYPTION
-- (Replace non-encrypted versions)
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
  DECLARE v_key VARCHAR(64);
  DECLARE v_inspector_id INT;
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_phone VARCHAR(20);
  DECLARE v_full_name VARCHAR(255);
  DECLARE v_has_key INT DEFAULT 0;
  
  -- Check if encryption is available
  SELECT COUNT(*) INTO v_has_key FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'encryption_keys';
  
  IF v_has_key > 0 THEN
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  END IF;
  
  SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
  
  IF v_key IS NOT NULL THEN
    -- Encrypt data
    IF p_email IS NOT NULL AND LENGTH(p_email) > 4 THEN
      SET v_masked_email = CONCAT(LEFT(p_email, 2), '***@***.', RIGHT(p_email, 3));
    ELSE
      SET v_masked_email = p_email;
    END IF;
    
    IF p_contact_no IS NOT NULL AND LENGTH(p_contact_no) > 4 THEN
      SET v_masked_phone = CONCAT(LEFT(p_contact_no, 2), '****', RIGHT(p_contact_no, 2));
    ELSE
      SET v_masked_phone = p_contact_no;
    END IF;
    
    INSERT INTO inspector (
      username, password_hash, first_name, last_name, inspector_name,
      email, contact_no, date_created, status,
      encrypted_email, encrypted_phone, is_encrypted
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name, v_full_name,
      v_masked_email, v_masked_phone, NOW(), 'active',
      AES_ENCRYPT(p_email, v_key),
      AES_ENCRYPT(p_contact_no, v_key),
      1
    );
  ELSE
    -- No encryption (fallback)
    INSERT INTO inspector (
      username, password_hash, first_name, last_name, inspector_name,
      email, contact_no, date_created, status
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name, v_full_name,
      p_email, p_contact_no, NOW(), 'active'
    );
  END IF;
  
  SET v_inspector_id = LAST_INSERT_ID();
  
  SELECT v_inspector_id as inspector_id;
END$$

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
  DECLARE v_key VARCHAR(64);
  DECLARE v_collector_id INT;
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_phone VARCHAR(20);
  DECLARE v_full_name VARCHAR(255);
  DECLARE v_has_key INT DEFAULT 0;
  
  -- Check if encryption is available
  SELECT COUNT(*) INTO v_has_key FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'encryption_keys';
  
  IF v_has_key > 0 THEN
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  END IF;
  
  SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
  
  IF v_key IS NOT NULL THEN
    -- Encrypt data
    IF p_email IS NOT NULL AND LENGTH(p_email) > 4 THEN
      SET v_masked_email = CONCAT(LEFT(p_email, 2), '***@***.', RIGHT(p_email, 3));
    ELSE
      SET v_masked_email = p_email;
    END IF;
    
    IF p_contact_no IS NOT NULL AND LENGTH(p_contact_no) > 4 THEN
      SET v_masked_phone = CONCAT(LEFT(p_contact_no, 2), '****', RIGHT(p_contact_no, 2));
    ELSE
      SET v_masked_phone = p_contact_no;
    END IF;
    
    INSERT INTO collector (
      username, password_hash, first_name, last_name, collector_name,
      email, contact_no, date_created, status,
      encrypted_email, encrypted_phone, is_encrypted
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name, v_full_name,
      v_masked_email, v_masked_phone, NOW(), 'active',
      AES_ENCRYPT(p_email, v_key),
      AES_ENCRYPT(p_contact_no, v_key),
      1
    );
  ELSE
    -- No encryption (fallback)
    INSERT INTO collector (
      username, password_hash, first_name, last_name, collector_name,
      email, contact_no, date_created, status
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name, v_full_name,
      p_email, p_contact_no, NOW(), 'active'
    );
  END IF;
  
  SET v_collector_id = LAST_INSERT_ID();
  
  SELECT v_collector_id as collector_id;
END$$

-- =============================================
-- UPDATE createBusinessEmployee TO USE ENCRYPTION
-- =============================================
DROP PROCEDURE IF EXISTS `createBusinessEmployee`$$

CREATE PROCEDURE `createBusinessEmployee` (
  IN `p_username` VARCHAR(20), 
  IN `p_password_hash` VARCHAR(255), 
  IN `p_first_name` VARCHAR(100), 
  IN `p_last_name` VARCHAR(100), 
  IN `p_email` VARCHAR(255), 
  IN `p_phone_number` VARCHAR(20), 
  IN `p_branch_id` INT, 
  IN `p_created_by_manager` INT, 
  IN `p_permissions` JSON
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_employee_id INT;
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_phone VARCHAR(20);
  DECLARE v_has_key INT DEFAULT 0;
  
  -- Check if encryption is available
  SELECT COUNT(*) INTO v_has_key FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'encryption_keys';
  
  IF v_has_key > 0 THEN
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  END IF;
  
  IF v_key IS NOT NULL THEN
    -- Encrypt data
    IF p_email IS NOT NULL AND LENGTH(p_email) > 4 THEN
      SET v_masked_email = CONCAT(LEFT(p_email, 2), '***@***.', RIGHT(p_email, 3));
    ELSE
      SET v_masked_email = p_email;
    END IF;
    
    IF p_phone_number IS NOT NULL AND LENGTH(p_phone_number) > 4 THEN
      SET v_masked_phone = CONCAT(LEFT(p_phone_number, 2), '****', RIGHT(p_phone_number, 2));
    ELSE
      SET v_masked_phone = p_phone_number;
    END IF;
    
    INSERT INTO `business_employee` (
      `employee_username`, `employee_password_hash`, `first_name`, `last_name`, 
      `email`, `phone_number`, `branch_id`, `created_by_manager`, 
      `permissions`, `status`, `password_reset_required`,
      `encrypted_email`, `encrypted_phone`, `is_encrypted`
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name,
      v_masked_email, v_masked_phone, p_branch_id, p_created_by_manager,
      p_permissions, 'Active', true,
      AES_ENCRYPT(p_email, v_key),
      AES_ENCRYPT(p_phone_number, v_key),
      1
    );
  ELSE
    -- No encryption (fallback)
    INSERT INTO `business_employee` (
      `employee_username`, `employee_password_hash`, `first_name`, `last_name`, 
      `email`, `phone_number`, `branch_id`, `created_by_manager`, 
      `permissions`, `status`, `password_reset_required`
    )
    VALUES (
      p_username, p_password_hash, p_first_name, p_last_name, p_email, 
      p_phone_number, p_branch_id, p_created_by_manager, p_permissions, 'Active', true
    );
  END IF;
  
  SET v_employee_id = LAST_INSERT_ID();
  
  SELECT v_employee_id as business_employee_id;
END$$

DELIMITER ;

SELECT '✅ Migration 416 complete - Staff creation procedures now encrypt data!' as status;
