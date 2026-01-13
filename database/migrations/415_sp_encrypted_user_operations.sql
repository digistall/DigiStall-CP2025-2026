-- Migration: 415_sp_encrypted_user_operations.sql
-- Description: Update ALL user creation stored procedures to encrypt sensitive data
-- MUST run AFTER 413_add_username_columns.sql and 414_sp_data_encryption.sql
-- =============================================

DELIMITER $$

-- =============================================
-- DROP OLD PROCEDURES
-- =============================================

DROP PROCEDURE IF EXISTS `createBusinessEmployee_Encrypted`$$
DROP PROCEDURE IF EXISTS `createInspector_Encrypted`$$
DROP PROCEDURE IF EXISTS `createCollector_Encrypted`$$
DROP PROCEDURE IF EXISTS `createApplicant_Encrypted`$$
DROP PROCEDURE IF EXISTS `registerMobileUser_Encrypted`$$
DROP PROCEDURE IF EXISTS `createStallholder_Encrypted`$$

-- =============================================
-- 1. ENCRYPTED BUSINESS EMPLOYEE CREATION
-- =============================================
CREATE PROCEDURE `createBusinessEmployee_Encrypted` (
  IN `p_username` VARCHAR(100),
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
  
  -- Get encryption key
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  -- Create masked versions
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
  
  SET v_employee_id = LAST_INSERT_ID();
  
  SELECT v_employee_id as business_employee_id;
END$$

-- =============================================
-- 2. ENCRYPTED INSPECTOR CREATION
-- =============================================
CREATE PROCEDURE `createInspector_Encrypted` (
  IN p_username VARCHAR(100),
  IN p_password_hash VARCHAR(255),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_phone_number VARCHAR(20),
  IN p_branch_id INT,
  IN p_assigned_area VARCHAR(255),
  IN p_status VARCHAR(20)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_inspector_id INT;
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_phone VARCHAR(20);
  DECLARE v_full_name VARCHAR(255);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
  
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
  
  INSERT INTO `inspector` (
    `username`, `password_hash`, `inspector_name`, `email`, `phone_number`,
    `branch_id`, `assigned_area`, `status`, `created_at`,
    `encrypted_email`, `encrypted_phone`, `is_encrypted`
  )
  VALUES (
    p_username, p_password_hash, v_full_name, v_masked_email, v_masked_phone,
    p_branch_id, p_assigned_area, COALESCE(p_status, 'Active'), NOW(),
    AES_ENCRYPT(p_email, v_key),
    AES_ENCRYPT(p_phone_number, v_key),
    1
  );
  
  SET v_inspector_id = LAST_INSERT_ID();
  
  SELECT v_inspector_id as inspector_id;
END$$

-- =============================================
-- 3. ENCRYPTED COLLECTOR CREATION
-- =============================================
CREATE PROCEDURE `createCollector_Encrypted` (
  IN p_username VARCHAR(100),
  IN p_password_hash VARCHAR(255),
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_phone_number VARCHAR(20),
  IN p_branch_id INT,
  IN p_assigned_area VARCHAR(255),
  IN p_status VARCHAR(20)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_collector_id INT;
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_phone VARCHAR(20);
  DECLARE v_full_name VARCHAR(255);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SET v_full_name = CONCAT(p_first_name, ' ', p_last_name);
  
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
  
  INSERT INTO `collector` (
    `username`, `password_hash`, `collector_name`, `email`, `phone_number`,
    `branch_id`, `assigned_area`, `status`, `created_at`,
    `encrypted_email`, `encrypted_phone`, `is_encrypted`
  )
  VALUES (
    p_username, p_password_hash, v_full_name, v_masked_email, v_masked_phone,
    p_branch_id, p_assigned_area, COALESCE(p_status, 'Active'), NOW(),
    AES_ENCRYPT(p_email, v_key),
    AES_ENCRYPT(p_phone_number, v_key),
    1
  );
  
  SET v_collector_id = LAST_INSERT_ID();
  
  SELECT v_collector_id as collector_id;
END$$

-- =============================================
-- 4. ENCRYPTED STALLHOLDER CREATION
-- =============================================
CREATE PROCEDURE `createStallholder_Encrypted` (
  IN p_applicant_id INT,
  IN p_stallholder_name VARCHAR(255),
  IN p_contact_number VARCHAR(20),
  IN p_email VARCHAR(255),
  IN p_address TEXT,
  IN p_business_name VARCHAR(255),
  IN p_business_type VARCHAR(100),
  IN p_branch_id INT,
  IN p_stall_id INT,
  IN p_contract_start DATE,
  IN p_contract_end DATE,
  IN p_lease_amount DECIMAL(10,2),
  IN p_monthly_rent DECIMAL(10,2),
  IN p_notes TEXT,
  IN p_created_by INT
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_stallholder_id INT;
  DECLARE v_masked_name VARCHAR(255);
  DECLARE v_masked_contact VARCHAR(20);
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_address TEXT;
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  -- Create masked versions
  IF p_stallholder_name IS NOT NULL AND LENGTH(p_stallholder_name) > 4 THEN
    SET v_masked_name = CONCAT(LEFT(p_stallholder_name, 2), '***', RIGHT(p_stallholder_name, 2));
  ELSE
    SET v_masked_name = p_stallholder_name;
  END IF;
  
  IF p_contact_number IS NOT NULL AND LENGTH(p_contact_number) > 4 THEN
    SET v_masked_contact = CONCAT(LEFT(p_contact_number, 2), '****', RIGHT(p_contact_number, 2));
  ELSE
    SET v_masked_contact = p_contact_number;
  END IF;
  
  IF p_email IS NOT NULL AND LENGTH(p_email) > 4 THEN
    SET v_masked_email = CONCAT(LEFT(p_email, 2), '***@***.', RIGHT(p_email, 3));
  ELSE
    SET v_masked_email = p_email;
  END IF;
  
  IF p_address IS NOT NULL AND LENGTH(p_address) > 4 THEN
    SET v_masked_address = CONCAT(LEFT(p_address, 2), '***', RIGHT(p_address, 2));
  ELSE
    SET v_masked_address = p_address;
  END IF;
  
  INSERT INTO `stallholder` (
    `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`,
    `business_name`, `business_type`, `branch_id`, `stall_id`,
    `contract_start_date`, `contract_end_date`, `contract_status`,
    `lease_amount`, `monthly_rent`, `payment_status`, `notes`,
    `created_by_business_manager`, `date_created`, `updated_at`,
    `encrypted_name`, `encrypted_contact`, `encrypted_email`, `encrypted_address`, `is_encrypted`
  )
  VALUES (
    p_applicant_id, v_masked_name, v_masked_contact, v_masked_email, v_masked_address,
    p_business_name, p_business_type, p_branch_id, p_stall_id,
    p_contract_start, p_contract_end, 'Active',
    p_lease_amount, p_monthly_rent, 'pending', p_notes,
    p_created_by, NOW(), NOW(),
    AES_ENCRYPT(p_stallholder_name, v_key),
    AES_ENCRYPT(p_contact_number, v_key),
    AES_ENCRYPT(p_email, v_key),
    AES_ENCRYPT(p_address, v_key),
    1
  );
  
  SET v_stallholder_id = LAST_INSERT_ID();
  
  SELECT v_stallholder_id as stallholder_id;
END$$

-- =============================================
-- 5. ENCRYPTED MOBILE USER REGISTRATION
-- =============================================
CREATE PROCEDURE `registerMobileUser_Encrypted` (
  IN p_full_name VARCHAR(255),
  IN p_contact_number VARCHAR(20),
  IN p_address TEXT,
  IN p_email VARCHAR(255),
  IN p_birthdate DATE,
  IN p_civil_status VARCHAR(50),
  IN p_education VARCHAR(100),
  IN p_username VARCHAR(100),
  IN p_password_hash VARCHAR(255)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_applicant_id INT;
  DECLARE v_masked_name VARCHAR(255);
  DECLARE v_masked_contact VARCHAR(20);
  DECLARE v_masked_email VARCHAR(255);
  DECLARE v_masked_address TEXT;
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  -- Create masked versions
  IF p_full_name IS NOT NULL AND LENGTH(p_full_name) > 4 THEN
    SET v_masked_name = CONCAT(LEFT(p_full_name, 2), '***', RIGHT(p_full_name, 2));
  ELSE
    SET v_masked_name = p_full_name;
  END IF;
  
  IF p_contact_number IS NOT NULL AND LENGTH(p_contact_number) > 4 THEN
    SET v_masked_contact = CONCAT(LEFT(p_contact_number, 2), '****', RIGHT(p_contact_number, 2));
  ELSE
    SET v_masked_contact = p_contact_number;
  END IF;
  
  IF p_email IS NOT NULL AND LENGTH(p_email) > 4 THEN
    SET v_masked_email = CONCAT(LEFT(p_email, 2), '***@***.', RIGHT(p_email, 3));
  ELSE
    SET v_masked_email = p_email;
  END IF;
  
  IF p_address IS NOT NULL AND LENGTH(p_address) > 4 THEN
    SET v_masked_address = CONCAT(LEFT(p_address, 2), '***', RIGHT(p_address, 2));
  ELSE
    SET v_masked_address = p_address;
  END IF;
  
  -- Insert applicant with encrypted data
  INSERT INTO `applicant` (
    `applicant_full_name`, `applicant_contact_number`, `applicant_address`,
    `applicant_email`, `applicant_username`, `applicant_birthdate`,
    `applicant_civil_status`, `applicant_educational_attainment`,
    `created_at`, `updated_at`,
    `encrypted_name`, `encrypted_contact`, `encrypted_email`, `encrypted_address`, `is_encrypted`
  )
  VALUES (
    v_masked_name, v_masked_contact, v_masked_address, v_masked_email, p_username,
    p_birthdate, p_civil_status, p_education,
    NOW(), NOW(),
    AES_ENCRYPT(p_full_name, v_key),
    AES_ENCRYPT(p_contact_number, v_key),
    AES_ENCRYPT(p_email, v_key),
    AES_ENCRYPT(p_address, v_key),
    1
  );
  
  SET v_applicant_id = LAST_INSERT_ID();
  
  -- Create credential
  INSERT INTO `credential` (
    `applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`
  )
  VALUES (
    v_applicant_id, p_username, p_password_hash, NOW(), 1
  );
  
  SELECT v_applicant_id as applicant_id, LAST_INSERT_ID() as registration_id;
END$$

-- =============================================
-- 6. GET DECRYPTED USER DATA FOR LOGIN
-- =============================================
CREATE PROCEDURE `sp_getDecryptedEmployeeForLogin` (
  IN p_username VARCHAR(100)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    be.business_employee_id,
    be.employee_username,
    be.employee_password_hash,
    be.first_name,
    be.last_name,
    CASE WHEN be.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(be.encrypted_email, v_key) AS CHAR(255))
    ELSE be.email END as email,
    CASE WHEN be.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(be.encrypted_phone, v_key) AS CHAR(50))
    ELSE be.phone_number END as phone_number,
    be.branch_id,
    be.permissions,
    be.status,
    be.password_reset_required,
    b.branch_name
  FROM business_employee be
  LEFT JOIN branch b ON be.branch_id = b.branch_id
  WHERE be.employee_username = p_username
    AND be.status = 'Active';
END$$

CREATE PROCEDURE `sp_getDecryptedInspectorForLogin` (
  IN p_username VARCHAR(100)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    i.password_hash,
    i.inspector_name,
    CASE WHEN i.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
    ELSE i.email END as email,
    CASE WHEN i.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(i.encrypted_phone, v_key) AS CHAR(50))
    ELSE i.phone_number END as phone_number,
    i.branch_id,
    i.assigned_area,
    i.status,
    b.branch_name
  FROM inspector i
  LEFT JOIN branch b ON i.branch_id = b.branch_id
  WHERE i.username = p_username
    AND i.status = 'Active';
END$$

CREATE PROCEDURE `sp_getDecryptedCollectorForLogin` (
  IN p_username VARCHAR(100)
)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id,
    c.username,
    c.password_hash,
    c.collector_name,
    CASE WHEN c.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
    ELSE c.email END as email,
    CASE WHEN c.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(c.encrypted_phone, v_key) AS CHAR(50))
    ELSE c.phone_number END as phone_number,
    c.branch_id,
    c.assigned_area,
    c.status,
    b.branch_name
  FROM collector c
  LEFT JOIN branch b ON c.branch_id = c.branch_id
  WHERE c.username = p_username
    AND c.status = 'Active';
END$$

-- =============================================
-- 7. GET DECRYPTED STALLHOLDER FOR DISPLAY
-- =============================================
CREATE PROCEDURE `sp_getDecryptedStallholderFull` (
  IN p_stallholder_id INT
)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    s.stallholder_id,
    s.applicant_id,
    CASE WHEN s.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(s.encrypted_name, v_key) AS CHAR(255))
    ELSE s.stallholder_name END as stallholder_name,
    CASE WHEN s.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(s.encrypted_contact, v_key) AS CHAR(50))
    ELSE s.contact_number END as contact_number,
    CASE WHEN s.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(s.encrypted_email, v_key) AS CHAR(255))
    ELSE s.email END as email,
    CASE WHEN s.is_encrypted = 1 THEN 
      CAST(AES_DECRYPT(s.encrypted_address, v_key) AS CHAR(500))
    ELSE s.address END as address,
    s.business_name,
    s.business_type,
    s.branch_id,
    s.stall_id,
    s.contract_start_date,
    s.contract_end_date,
    s.contract_status,
    s.lease_amount,
    s.monthly_rent,
    s.payment_status,
    b.branch_name,
    st.stall_no
  FROM stallholder s
  LEFT JOIN branch b ON s.branch_id = b.branch_id
  LEFT JOIN stall st ON s.stall_id = st.stall_id
  WHERE s.stallholder_id = p_stallholder_id;
END$$

-- =============================================
-- 8. ADD ENCRYPTED COLUMNS TO BUSINESS_EMPLOYEE, INSPECTOR, COLLECTOR
-- =============================================
-- (These should already exist from 413, but add them if missing)

-- Check and add columns for business_employee
DROP PROCEDURE IF EXISTS `add_encrypted_columns_employee`$$
CREATE PROCEDURE `add_encrypted_columns_employee`()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'business_employee' AND COLUMN_NAME = 'encrypted_email'
  ) THEN
    ALTER TABLE business_employee
    ADD COLUMN encrypted_email VARBINARY(512) NULL,
    ADD COLUMN encrypted_phone VARBINARY(256) NULL,
    ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
  END IF;
END$$
CALL add_encrypted_columns_employee()$$
DROP PROCEDURE IF EXISTS `add_encrypted_columns_employee`$$

-- Check and add columns for inspector
DROP PROCEDURE IF EXISTS `add_encrypted_columns_inspector`$$
CREATE PROCEDURE `add_encrypted_columns_inspector`()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'inspector' AND COLUMN_NAME = 'encrypted_email'
  ) THEN
    ALTER TABLE inspector
    ADD COLUMN encrypted_email VARBINARY(512) NULL,
    ADD COLUMN encrypted_phone VARBINARY(256) NULL,
    ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
  END IF;
END$$
CALL add_encrypted_columns_inspector()$$
DROP PROCEDURE IF EXISTS `add_encrypted_columns_inspector`$$

-- Check and add columns for collector
DROP PROCEDURE IF EXISTS `add_encrypted_columns_collector`$$
CREATE PROCEDURE `add_encrypted_columns_collector`()
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector' AND COLUMN_NAME = 'encrypted_email'
  ) THEN
    ALTER TABLE collector
    ADD COLUMN encrypted_email VARBINARY(512) NULL,
    ADD COLUMN encrypted_phone VARBINARY(256) NULL,
    ADD COLUMN is_encrypted TINYINT(1) DEFAULT 0;
  END IF;
END$$
CALL add_encrypted_columns_collector()$$
DROP PROCEDURE IF EXISTS `add_encrypted_columns_collector`$$

DELIMITER ;

-- =============================================
-- ENCRYPT EXISTING DATA IN EMPLOYEE/INSPECTOR/COLLECTOR
-- =============================================
DELIMITER $$

CREATE PROCEDURE `sp_encryptExistingStaffData`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  -- Encrypt business_employee data
  UPDATE business_employee
  SET 
    encrypted_email = AES_ENCRYPT(email, v_key),
    encrypted_phone = AES_ENCRYPT(phone_number, v_key),
    email = CASE WHEN email IS NOT NULL AND LENGTH(email) > 4 
            THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
            ELSE email END,
    phone_number = CASE WHEN phone_number IS NOT NULL AND LENGTH(phone_number) > 4 
                   THEN CONCAT(LEFT(phone_number, 2), '****', RIGHT(phone_number, 2)) 
                   ELSE phone_number END,
    is_encrypted = 1
  WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  -- Encrypt inspector data
  UPDATE inspector
  SET 
    encrypted_email = AES_ENCRYPT(email, v_key),
    encrypted_phone = AES_ENCRYPT(phone_number, v_key),
    email = CASE WHEN email IS NOT NULL AND LENGTH(email) > 4 
            THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
            ELSE email END,
    phone_number = CASE WHEN phone_number IS NOT NULL AND LENGTH(phone_number) > 4 
                   THEN CONCAT(LEFT(phone_number, 2), '****', RIGHT(phone_number, 2)) 
                   ELSE phone_number END,
    is_encrypted = 1
  WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  -- Encrypt collector data
  UPDATE collector
  SET 
    encrypted_email = AES_ENCRYPT(email, v_key),
    encrypted_phone = AES_ENCRYPT(phone_number, v_key),
    email = CASE WHEN email IS NOT NULL AND LENGTH(email) > 4 
            THEN CONCAT(LEFT(email, 2), '***@***.', RIGHT(email, 3)) 
            ELSE email END,
    phone_number = CASE WHEN phone_number IS NOT NULL AND LENGTH(phone_number) > 4 
                   THEN CONCAT(LEFT(phone_number, 2), '****', RIGHT(phone_number, 2)) 
                   ELSE phone_number END,
    is_encrypted = 1
  WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  SELECT 'All staff data encrypted successfully' as result;
END$$

DELIMITER ;

SELECT '✅ Migration 415 complete - Encrypted user operations ready!' as status;
