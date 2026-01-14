-- =============================================
-- 414: Data Encryption Stored Procedures
-- AES-256 Encryption for sensitive user data
-- Created: Auto-generated for security compliance
-- =============================================

DELIMITER $$

-- =============================================
-- Get encryption key
-- =============================================
DROP FUNCTION IF EXISTS fn_getEncryptionKey$$
CREATE FUNCTION fn_getEncryptionKey()
RETURNS VARBINARY(64)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_key VARBINARY(64);
  SELECT key_value INTO v_key FROM encryption_keys WHERE key_name = 'default_key' AND is_active = 1 LIMIT 1;
  RETURN v_key;
END$$

-- =============================================
-- Encrypt a string value
-- =============================================
DROP FUNCTION IF EXISTS fn_encrypt$$
CREATE FUNCTION fn_encrypt(p_plaintext TEXT)
RETURNS VARBINARY(2048)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_key VARBINARY(64);
  IF p_plaintext IS NULL OR p_plaintext = '' THEN
    RETURN NULL;
  END IF;
  SET v_key = fn_getEncryptionKey();
  RETURN AES_ENCRYPT(p_plaintext, v_key);
END$$

-- =============================================
-- Decrypt a value
-- =============================================
DROP FUNCTION IF EXISTS fn_decrypt$$
CREATE FUNCTION fn_decrypt(p_ciphertext VARBINARY(2048))
RETURNS TEXT
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_key VARBINARY(64);
  IF p_ciphertext IS NULL THEN
    RETURN NULL;
  END IF;
  SET v_key = fn_getEncryptionKey();
  RETURN AES_DECRYPT(p_ciphertext, v_key);
END$$

-- =============================================
-- ENCRYPT EXISTING APPLICANT DATA
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptApplicantData$$
CREATE PROCEDURE sp_encryptApplicantData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_full_name VARCHAR(255);
  DECLARE v_contact VARCHAR(50);
  DECLARE v_email VARCHAR(255);
  DECLARE v_address TEXT;
  DECLARE v_birthdate DATE;
  
  DECLARE cur CURSOR FOR 
    SELECT applicant_id, applicant_full_name, applicant_contact_number, 
           applicant_email, applicant_address, applicant_birthdate
    FROM applicant WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_full_name, v_contact, v_email, v_address, v_birthdate;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    UPDATE applicant 
    SET 
      encrypted_full_name = fn_encrypt(v_full_name),
      encrypted_contact = fn_encrypt(v_contact),
      encrypted_email = fn_encrypt(v_email),
      encrypted_address = fn_encrypt(v_address),
      encrypted_birthdate = fn_encrypt(DATE_FORMAT(v_birthdate, '%Y-%m-%d')),
      -- Mask original data (keep first 2 and last 2 chars)
      applicant_full_name = CONCAT(LEFT(v_full_name, 2), '***', RIGHT(v_full_name, 2)),
      applicant_contact_number = CONCAT(LEFT(v_contact, 3), '****', RIGHT(v_contact, 2)),
      applicant_email = CONCAT(LEFT(v_email, 2), '***@***', SUBSTRING_INDEX(v_email, '.', -1)),
      applicant_address = '*** ENCRYPTED ***',
      is_encrypted = 1
    WHERE applicant_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' applicant records') as status;
END$$

-- =============================================
-- ENCRYPT EXISTING STALLHOLDER DATA
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptStallholderData$$
CREATE PROCEDURE sp_encryptStallholderData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_name VARCHAR(255);
  DECLARE v_email VARCHAR(255);
  DECLARE v_contact VARCHAR(50);
  DECLARE v_address TEXT;
  
  DECLARE cur CURSOR FOR 
    SELECT stallholder_id, stallholder_name, email, contact_number, address
    FROM stallholder WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_name, v_email, v_contact, v_address;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    UPDATE stallholder 
    SET 
      encrypted_name = fn_encrypt(v_name),
      encrypted_email = fn_encrypt(v_email),
      encrypted_contact = fn_encrypt(v_contact),
      encrypted_address = fn_encrypt(v_address),
      -- Mask original data
      stallholder_name = CONCAT(LEFT(v_name, 2), '***', RIGHT(v_name, 2)),
      email = CONCAT(LEFT(v_email, 2), '***@***', SUBSTRING_INDEX(v_email, '.', -1)),
      contact_number = CONCAT(LEFT(v_contact, 3), '****', RIGHT(v_contact, 2)),
      address = '*** ENCRYPTED ***',
      is_encrypted = 1
    WHERE stallholder_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' stallholder records') as status;
END$$

-- =============================================
-- ENCRYPT EXISTING BUSINESS MANAGER DATA
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptBusinessManagerData$$
CREATE PROCEDURE sp_encryptBusinessManagerData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_first_name VARCHAR(100);
  DECLARE v_last_name VARCHAR(100);
  DECLARE v_email VARCHAR(255);
  DECLARE v_contact VARCHAR(50);
  
  DECLARE cur CURSOR FOR 
    SELECT business_manager_id, first_name, last_name, email, contact_no
    FROM business_manager WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_first_name, v_last_name, v_email, v_contact;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    UPDATE business_manager 
    SET 
      encrypted_first_name = fn_encrypt(v_first_name),
      encrypted_last_name = fn_encrypt(v_last_name),
      encrypted_email = fn_encrypt(v_email),
      encrypted_contact = fn_encrypt(v_contact),
      -- Mask original data
      first_name = CONCAT(LEFT(v_first_name, 1), '***'),
      last_name = CONCAT(LEFT(v_last_name, 1), '***'),
      email = CONCAT(LEFT(v_email, 2), '***@***', SUBSTRING_INDEX(v_email, '.', -1)),
      contact_no = CONCAT(LEFT(COALESCE(v_contact, ''), 3), '****'),
      is_encrypted = 1
    WHERE business_manager_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' business manager records') as status;
END$$

-- =============================================
-- ENCRYPT EXISTING EMPLOYEE DATA
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptEmployeeData$$
CREATE PROCEDURE sp_encryptEmployeeData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_first_name VARCHAR(100);
  DECLARE v_last_name VARCHAR(100);
  DECLARE v_email VARCHAR(255);
  DECLARE v_contact VARCHAR(50);
  
  DECLARE cur CURSOR FOR 
    SELECT employee_id, first_name, last_name, email, contact_no
    FROM employee WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_first_name, v_last_name, v_email, v_contact;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    UPDATE employee 
    SET 
      encrypted_first_name = fn_encrypt(v_first_name),
      encrypted_last_name = fn_encrypt(v_last_name),
      encrypted_email = fn_encrypt(v_email),
      encrypted_contact = fn_encrypt(v_contact),
      -- Mask original data
      first_name = CONCAT(LEFT(v_first_name, 1), '***'),
      last_name = CONCAT(LEFT(v_last_name, 1), '***'),
      email = CONCAT(LEFT(v_email, 2), '***@***', SUBSTRING_INDEX(v_email, '.', -1)),
      contact_no = CONCAT(LEFT(COALESCE(v_contact, ''), 3), '****'),
      is_encrypted = 1
    WHERE employee_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' employee records') as status;
END$$

-- =============================================
-- ENCRYPT EXISTING INSPECTOR DATA
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptInspectorData$$
CREATE PROCEDURE sp_encryptInspectorData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_first_name VARCHAR(100);
  DECLARE v_last_name VARCHAR(100);
  DECLARE v_email VARCHAR(255);
  DECLARE v_contact VARCHAR(50);
  
  DECLARE cur CURSOR FOR 
    SELECT inspector_id, first_name, last_name, email, contact_no
    FROM inspector WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_first_name, v_last_name, v_email, v_contact;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    UPDATE inspector 
    SET 
      encrypted_first_name = fn_encrypt(v_first_name),
      encrypted_last_name = fn_encrypt(v_last_name),
      encrypted_email = fn_encrypt(v_email),
      encrypted_contact = fn_encrypt(v_contact),
      -- Mask original data
      first_name = CONCAT(LEFT(v_first_name, 1), '***'),
      last_name = CONCAT(LEFT(v_last_name, 1), '***'),
      email = CONCAT(LEFT(v_email, 2), '***@***', SUBSTRING_INDEX(v_email, '.', -1)),
      contact_no = CONCAT(LEFT(COALESCE(v_contact, ''), 3), '****'),
      is_encrypted = 1
    WHERE inspector_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' inspector records') as status;
END$$

-- =============================================
-- ENCRYPT EXISTING COLLECTOR DATA
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptCollectorData$$
CREATE PROCEDURE sp_encryptCollectorData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_first_name VARCHAR(100);
  DECLARE v_last_name VARCHAR(100);
  DECLARE v_email VARCHAR(255);
  DECLARE v_contact VARCHAR(50);
  
  DECLARE cur CURSOR FOR 
    SELECT collector_id, first_name, last_name, email, contact_no
    FROM collector WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_first_name, v_last_name, v_email, v_contact;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    UPDATE collector 
    SET 
      encrypted_first_name = fn_encrypt(v_first_name),
      encrypted_last_name = fn_encrypt(v_last_name),
      encrypted_email = fn_encrypt(v_email),
      encrypted_contact = fn_encrypt(v_contact),
      -- Mask original data
      first_name = CONCAT(LEFT(v_first_name, 1), '***'),
      last_name = CONCAT(LEFT(v_last_name, 1), '***'),
      email = CONCAT(LEFT(v_email, 2), '***@***', SUBSTRING_INDEX(v_email, '.', -1)),
      contact_no = CONCAT(LEFT(COALESCE(v_contact, ''), 3), '****'),
      is_encrypted = 1
    WHERE collector_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' collector records') as status;
END$$

-- =============================================
-- ENCRYPT EXISTING SPOUSE DATA
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptSpouseData$$
CREATE PROCEDURE sp_encryptSpouseData()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_id INT;
  DECLARE v_full_name VARCHAR(255);
  DECLARE v_contact VARCHAR(50);
  
  DECLARE cur CURSOR FOR 
    SELECT spouse_id, spouse_full_name, spouse_contact_number
    FROM spouse WHERE is_encrypted = 0 OR is_encrypted IS NULL;
  
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;
  
  OPEN cur;
  
  read_loop: LOOP
    FETCH cur INTO v_id, v_full_name, v_contact;
    IF done THEN
      LEAVE read_loop;
    END IF;
    
    UPDATE spouse 
    SET 
      encrypted_full_name = fn_encrypt(v_full_name),
      encrypted_contact = fn_encrypt(v_contact),
      -- Mask original data
      spouse_full_name = CONCAT(LEFT(COALESCE(v_full_name, ''), 2), '***'),
      spouse_contact_number = CONCAT(LEFT(COALESCE(v_contact, ''), 3), '****'),
      is_encrypted = 1
    WHERE spouse_id = v_id;
  END LOOP;
  
  CLOSE cur;
  
  SELECT CONCAT('Encrypted ', ROW_COUNT(), ' spouse records') as status;
END$$

-- =============================================
-- MASTER ENCRYPTION PROCEDURE - ENCRYPT ALL
-- =============================================
DROP PROCEDURE IF EXISTS sp_encryptAllUserData$$
CREATE PROCEDURE sp_encryptAllUserData()
BEGIN
  SELECT '🔐 Starting encryption of all user data...' as status;
  
  CALL sp_encryptApplicantData();
  CALL sp_encryptStallholderData();
  CALL sp_encryptBusinessManagerData();
  CALL sp_encryptEmployeeData();
  CALL sp_encryptInspectorData();
  CALL sp_encryptCollectorData();
  CALL sp_encryptSpouseData();
  
  SELECT '✅ All user data encrypted successfully!' as final_status;
END$$

-- =============================================
-- DECRYPT USER DATA FOR DISPLAY (returns decrypted)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getDecryptedApplicant$$
CREATE PROCEDURE sp_getDecryptedApplicant(IN p_applicant_id INT)
BEGIN
  SELECT 
    applicant_id,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_full_name) ELSE applicant_full_name END as applicant_full_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_contact) ELSE applicant_contact_number END as applicant_contact_number,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_email) ELSE applicant_email END as applicant_email,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_address) ELSE applicant_address END as applicant_address,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_birthdate) ELSE applicant_birthdate END as applicant_birthdate,
    applicant_civil_status,
    applicant_educational_attainment,
    created_date
  FROM applicant
  WHERE applicant_id = p_applicant_id;
END$$

-- =============================================
-- DECRYPT STALLHOLDER DATA FOR DISPLAY
-- =============================================
DROP PROCEDURE IF EXISTS sp_getDecryptedStallholder$$
CREATE PROCEDURE sp_getDecryptedStallholder(IN p_stallholder_id INT)
BEGIN
  SELECT 
    stallholder_id,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_name) ELSE stallholder_name END as stallholder_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_email) ELSE email END as email,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_contact) ELSE contact_number END as contact_number,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_address) ELSE address END as address,
    applicant_id,
    stall_id,
    branch_id,
    business_name,
    business_type,
    status
  FROM stallholder
  WHERE stallholder_id = p_stallholder_id;
END$$

-- =============================================
-- DECRYPT BUSINESS MANAGER FOR LOGIN
-- =============================================
DROP PROCEDURE IF EXISTS sp_getDecryptedBusinessManager$$
CREATE PROCEDURE sp_getDecryptedBusinessManager(IN p_id INT)
BEGIN
  SELECT 
    business_manager_id,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_first_name) ELSE first_name END as first_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_last_name) ELSE last_name END as last_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_email) ELSE email END as email,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_contact) ELSE contact_no END as contact_no,
    username,
    password,
    branch_id
  FROM business_manager
  WHERE business_manager_id = p_id;
END$$

-- =============================================
-- DECRYPT EMPLOYEE FOR LOGIN
-- =============================================
DROP PROCEDURE IF EXISTS sp_getDecryptedEmployee$$
CREATE PROCEDURE sp_getDecryptedEmployee(IN p_id INT)
BEGIN
  SELECT 
    employee_id,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_first_name) ELSE first_name END as first_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_last_name) ELSE last_name END as last_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_email) ELSE email END as email,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_contact) ELSE contact_no END as contact_no,
    username,
    password,
    branch_id,
    permissions
  FROM employee
  WHERE employee_id = p_id;
END$$

-- =============================================
-- INSERT NEW APPLICANT WITH ENCRYPTION
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertApplicantEncrypted$$
CREATE PROCEDURE sp_insertApplicantEncrypted(
  IN p_full_name VARCHAR(255),
  IN p_contact VARCHAR(50),
  IN p_email VARCHAR(255),
  IN p_address TEXT,
  IN p_birthdate DATE,
  IN p_civil_status VARCHAR(50),
  IN p_educational_attainment VARCHAR(100)
)
BEGIN
  INSERT INTO applicant (
    applicant_full_name,
    encrypted_full_name,
    applicant_contact_number,
    encrypted_contact,
    applicant_email,
    encrypted_email,
    applicant_address,
    encrypted_address,
    applicant_birthdate,
    encrypted_birthdate,
    applicant_civil_status,
    applicant_educational_attainment,
    is_encrypted,
    created_date
  ) VALUES (
    CONCAT(LEFT(p_full_name, 2), '***', RIGHT(p_full_name, 2)),
    fn_encrypt(p_full_name),
    CONCAT(LEFT(p_contact, 3), '****', RIGHT(p_contact, 2)),
    fn_encrypt(p_contact),
    CONCAT(LEFT(p_email, 2), '***@***', SUBSTRING_INDEX(p_email, '.', -1)),
    fn_encrypt(p_email),
    '*** ENCRYPTED ***',
    fn_encrypt(p_address),
    p_birthdate,
    fn_encrypt(DATE_FORMAT(p_birthdate, '%Y-%m-%d')),
    p_civil_status,
    p_educational_attainment,
    1,
    NOW()
  );
  SELECT LAST_INSERT_ID() as applicant_id;
END$$

-- =============================================
-- INSERT NEW BUSINESS MANAGER WITH ENCRYPTION
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertBusinessManagerEncrypted$$
CREATE PROCEDURE sp_insertBusinessManagerEncrypted(
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_contact VARCHAR(50),
  IN p_username VARCHAR(100),
  IN p_branch_id INT
)
BEGIN
  INSERT INTO business_manager (
    first_name,
    encrypted_first_name,
    last_name,
    encrypted_last_name,
    email,
    encrypted_email,
    password,
    contact_no,
    encrypted_contact,
    username,
    branch_id,
    is_encrypted,
    created_at
  ) VALUES (
    CONCAT(LEFT(p_first_name, 1), '***'),
    fn_encrypt(p_first_name),
    CONCAT(LEFT(p_last_name, 1), '***'),
    fn_encrypt(p_last_name),
    CONCAT(LEFT(p_email, 2), '***@***', SUBSTRING_INDEX(p_email, '.', -1)),
    fn_encrypt(p_email),
    p_password,
    CONCAT(LEFT(COALESCE(p_contact, ''), 3), '****'),
    fn_encrypt(p_contact),
    p_username,
    p_branch_id,
    1,
    NOW()
  );
  SELECT LAST_INSERT_ID() as business_manager_id;
END$$

-- =============================================
-- INSERT NEW EMPLOYEE WITH ENCRYPTION
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertEmployeeEncrypted$$
CREATE PROCEDURE sp_insertEmployeeEncrypted(
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_password VARCHAR(255),
  IN p_contact VARCHAR(50),
  IN p_username VARCHAR(100),
  IN p_branch_id INT,
  IN p_permissions TEXT
)
BEGIN
  INSERT INTO employee (
    first_name,
    encrypted_first_name,
    last_name,
    encrypted_last_name,
    email,
    encrypted_email,
    password,
    contact_no,
    encrypted_contact,
    username,
    branch_id,
    permissions,
    is_encrypted,
    created_at
  ) VALUES (
    CONCAT(LEFT(p_first_name, 1), '***'),
    fn_encrypt(p_first_name),
    CONCAT(LEFT(p_last_name, 1), '***'),
    fn_encrypt(p_last_name),
    CONCAT(LEFT(p_email, 2), '***@***', SUBSTRING_INDEX(p_email, '.', -1)),
    fn_encrypt(p_email),
    p_password,
    CONCAT(LEFT(COALESCE(p_contact, ''), 3), '****'),
    fn_encrypt(p_contact),
    p_username,
    p_branch_id,
    p_permissions,
    1,
    NOW()
  );
  SELECT LAST_INSERT_ID() as employee_id;
END$$

-- =============================================
-- LOGIN BY USERNAME (for manager/employee)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getManagerByUsername$$
CREATE PROCEDURE sp_getManagerByUsername(IN p_username VARCHAR(100))
BEGIN
  SELECT 
    business_manager_id,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_first_name) ELSE first_name END as first_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_last_name) ELSE last_name END as last_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_email) ELSE email END as email,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_contact) ELSE contact_no END as contact_no,
    username,
    password,
    branch_id
  FROM business_manager
  WHERE username = p_username;
END$$

DROP PROCEDURE IF EXISTS sp_getEmployeeByUsername$$
CREATE PROCEDURE sp_getEmployeeByUsername(IN p_username VARCHAR(100))
BEGIN
  SELECT 
    employee_id,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_first_name) ELSE first_name END as first_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_last_name) ELSE last_name END as last_name,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_email) ELSE email END as email,
    CASE WHEN is_encrypted = 1 THEN fn_decrypt(encrypted_contact) ELSE contact_no END as contact_no,
    username,
    password,
    branch_id,
    permissions
  FROM employee
  WHERE username = p_username;
END$$

DELIMITER ;

-- Success message
SELECT 'Encryption stored procedures created successfully' as status;
