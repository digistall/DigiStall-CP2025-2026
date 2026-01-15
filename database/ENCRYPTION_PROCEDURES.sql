-- =====================================================
-- AES-256-CBC ENCRYPTION/DECRYPTION STORED PROCEDURES
-- =====================================================
-- MySQL does not support GCM mode natively.
-- AES-256-CBC with random IV is industry-standard secure.
-- 
-- Data stored in encrypted_* columns as: IV (16 bytes) + CipherText
-- Original columns (name, email, etc.) are cleared after encryption
-- =====================================================

-- Set encryption mode to AES-256-CBC
SET GLOBAL block_encryption_mode = 'aes-256-cbc';

-- =====================================================
-- ENCRYPTION KEY (stored in encryption_keys table)
-- =====================================================
-- Key: da97ee333e18b86ce9326ee721eb5ed3d4f65a74566c22130927d96fd26a59b8

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

DROP FUNCTION IF EXISTS fn_encrypt_value;
DELIMITER $$
CREATE FUNCTION fn_encrypt_value(plain_text VARCHAR(2000), enc_key VARCHAR(64))
RETURNS VARBINARY(4096)
DETERMINISTIC
BEGIN
    DECLARE iv VARBINARY(16);
    DECLARE encrypted VARBINARY(4096);
    
    IF plain_text IS NULL OR plain_text = '' THEN
        RETURN NULL;
    END IF;
    
    -- Generate random 16-byte IV
    SET iv = RANDOM_BYTES(16);
    
    -- Encrypt using AES-256-CBC
    SET encrypted = AES_ENCRYPT(plain_text, UNHEX(enc_key), iv);
    
    -- Return IV + CipherText concatenated
    RETURN CONCAT(iv, encrypted);
END$$
DELIMITER ;

DROP FUNCTION IF EXISTS fn_decrypt_value;
DELIMITER $$
CREATE FUNCTION fn_decrypt_value(encrypted_data VARBINARY(4096), enc_key VARCHAR(64))
RETURNS VARCHAR(2000)
DETERMINISTIC
BEGIN
    DECLARE iv VARBINARY(16);
    DECLARE cipher_text VARBINARY(4096);
    DECLARE decrypted VARCHAR(2000);
    
    IF encrypted_data IS NULL OR LENGTH(encrypted_data) < 17 THEN
        RETURN NULL;
    END IF;
    
    -- Extract IV (first 16 bytes)
    SET iv = SUBSTRING(encrypted_data, 1, 16);
    
    -- Extract CipherText (rest)
    SET cipher_text = SUBSTRING(encrypted_data, 17);
    
    -- Decrypt using AES-256-CBC
    SET decrypted = AES_DECRYPT(cipher_text, UNHEX(enc_key), iv);
    
    RETURN decrypted;
END$$
DELIMITER ;

-- =====================================================
-- APPLICANT TABLE PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_applicant;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_applicant(IN p_applicant_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE applicant SET
        encrypted_full_name = fn_encrypt_value(applicant_full_name, v_key),
        encrypted_email = fn_encrypt_value(applicant_email, v_key),
        encrypted_contact = fn_encrypt_value(applicant_contact_number, v_key),
        encrypted_address = fn_encrypt_value(applicant_address, v_key),
        is_encrypted = 1,
        applicant_full_name = '***ENCRYPTED***',
        applicant_email = CONCAT(LEFT(applicant_email, 3), '***@***.***'),
        applicant_contact_number = '***ENCRYPTED***',
        applicant_address = '***ENCRYPTED***'
    WHERE applicant_id = p_applicant_id 
    AND (is_encrypted IS NULL OR is_encrypted = 0);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_encrypt_all_applicants;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_applicants()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE applicant SET
        encrypted_full_name = fn_encrypt_value(applicant_full_name, v_key),
        encrypted_email = fn_encrypt_value(applicant_email, v_key),
        encrypted_contact = fn_encrypt_value(applicant_contact_number, v_key),
        encrypted_address = fn_encrypt_value(applicant_address, v_key),
        is_encrypted = 1,
        applicant_full_name = '***ENCRYPTED***',
        applicant_email = CONCAT(LEFT(applicant_email, 3), '***@***.***'),
        applicant_contact_number = '***ENCRYPTED***',
        applicant_address = '***ENCRYPTED***'
    WHERE (is_encrypted IS NULL OR is_encrypted = 0)
    AND applicant_full_name IS NOT NULL 
    AND applicant_full_name != '***ENCRYPTED***';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_applicants_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_applicants_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        applicant_id,
        COALESCE(fn_decrypt_value(encrypted_full_name, v_key), applicant_full_name) AS applicant_full_name,
        COALESCE(fn_decrypt_value(encrypted_email, v_key), applicant_email) AS applicant_email,
        COALESCE(fn_decrypt_value(encrypted_contact, v_key), applicant_contact_number) AS applicant_contact_number,
        COALESCE(fn_decrypt_value(encrypted_address, v_key), applicant_address) AS applicant_address,
        applicant_birthdate,
        applicant_civil_status,
        applicant_educational_attainment,
        applicant_username,
        created_at,
        updated_at,
        is_encrypted
    FROM applicant
    ORDER BY applicant_id DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_applicant_by_id_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_applicant_by_id_decrypted(IN p_applicant_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        applicant_id,
        COALESCE(fn_decrypt_value(encrypted_full_name, v_key), applicant_full_name) AS applicant_full_name,
        COALESCE(fn_decrypt_value(encrypted_email, v_key), applicant_email) AS applicant_email,
        COALESCE(fn_decrypt_value(encrypted_contact, v_key), applicant_contact_number) AS applicant_contact_number,
        COALESCE(fn_decrypt_value(encrypted_address, v_key), applicant_address) AS applicant_address,
        applicant_birthdate,
        applicant_civil_status,
        applicant_educational_attainment,
        applicant_username,
        created_at,
        updated_at,
        is_encrypted
    FROM applicant
    WHERE applicant_id = p_applicant_id;
END$$
DELIMITER ;

-- =====================================================
-- BUSINESS_EMPLOYEE TABLE PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_business_employee;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_business_employee(IN p_employee_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE business_employee SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_phone = fn_encrypt_value(phone_number, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        phone_number = '***ENCRYPTED***'
    WHERE business_employee_id = p_employee_id
    AND (is_encrypted IS NULL OR is_encrypted = 0);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_encrypt_all_business_employees;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_business_employees()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE business_employee SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_phone = fn_encrypt_value(phone_number, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        phone_number = '***ENCRYPTED***'
    WHERE (is_encrypted IS NULL OR is_encrypted = 0)
    AND first_name IS NOT NULL 
    AND first_name != '***ENCRYPTED***';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_business_employees_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_business_employees_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        e.business_employee_id,
        e.employee_username,
        COALESCE(fn_decrypt_value(e.encrypted_first_name, v_key), e.first_name) AS first_name,
        COALESCE(fn_decrypt_value(e.encrypted_last_name, v_key), e.last_name) AS last_name,
        COALESCE(fn_decrypt_value(e.encrypted_email, v_key), e.email) AS email,
        COALESCE(fn_decrypt_value(e.encrypted_phone, v_key), e.phone_number) AS phone_number,
        e.branch_id,
        b.branch_name,
        e.permissions,
        e.status,
        e.last_login,
        e.created_at,
        e.is_encrypted
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id
    ORDER BY e.business_employee_id DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_business_employees_by_branch_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_business_employees_by_branch_decrypted(IN p_branch_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        e.business_employee_id,
        e.employee_username,
        COALESCE(fn_decrypt_value(e.encrypted_first_name, v_key), e.first_name) AS first_name,
        COALESCE(fn_decrypt_value(e.encrypted_last_name, v_key), e.last_name) AS last_name,
        COALESCE(fn_decrypt_value(e.encrypted_email, v_key), e.email) AS email,
        COALESCE(fn_decrypt_value(e.encrypted_phone, v_key), e.phone_number) AS phone_number,
        e.branch_id,
        b.branch_name,
        e.permissions,
        e.status,
        e.last_login,
        e.created_at,
        e.is_encrypted
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id
    WHERE e.branch_id = p_branch_id
    ORDER BY e.business_employee_id DESC;
END$$
DELIMITER ;

-- =====================================================
-- BUSINESS_MANAGER TABLE PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_business_manager;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_business_manager(IN p_manager_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE business_manager SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_number, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_number = '***ENCRYPTED***'
    WHERE business_manager_id = p_manager_id
    AND (is_encrypted IS NULL OR is_encrypted = 0);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_encrypt_all_business_managers;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_business_managers()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE business_manager SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_number, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_number = '***ENCRYPTED***'
    WHERE (is_encrypted IS NULL OR is_encrypted = 0)
    AND first_name IS NOT NULL 
    AND first_name != '***ENCRYPTED***';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_business_managers_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_business_managers_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        m.business_manager_id,
        m.manager_username,
        COALESCE(fn_decrypt_value(m.encrypted_first_name, v_key), m.first_name) AS first_name,
        COALESCE(fn_decrypt_value(m.encrypted_last_name, v_key), m.last_name) AS last_name,
        COALESCE(fn_decrypt_value(m.encrypted_email, v_key), m.email) AS email,
        COALESCE(fn_decrypt_value(m.encrypted_contact, v_key), m.contact_number) AS contact_number,
        m.branch_id,
        b.branch_name,
        m.status,
        m.last_login,
        m.created_at,
        m.is_encrypted
    FROM business_manager m
    LEFT JOIN branch b ON m.branch_id = b.branch_id
    ORDER BY m.business_manager_id DESC;
END$$
DELIMITER ;

-- =====================================================
-- COLLECTOR TABLE PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_collector;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_collector(IN p_collector_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE collector SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_no, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_no = '***ENCRYPTED***'
    WHERE collector_id = p_collector_id
    AND (is_encrypted IS NULL OR is_encrypted = 0);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_encrypt_all_collectors;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_collectors()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE collector SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_no, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_no = '***ENCRYPTED***'
    WHERE (is_encrypted IS NULL OR is_encrypted = 0)
    AND first_name IS NOT NULL 
    AND first_name != '***ENCRYPTED***';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_collectors_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_collectors_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        COALESCE(fn_decrypt_value(c.encrypted_first_name, v_key), c.first_name) AS first_name,
        COALESCE(fn_decrypt_value(c.encrypted_last_name, v_key), c.last_name) AS last_name,
        COALESCE(fn_decrypt_value(c.encrypted_email, v_key), c.email) AS email,
        COALESCE(fn_decrypt_value(c.encrypted_contact, v_key), c.contact_no) AS contact_no,
        c.status,
        c.date_hired,
        c.last_login,
        c.is_encrypted
    FROM collector c
    ORDER BY c.collector_id DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_active_collectors_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_active_collectors_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        COALESCE(fn_decrypt_value(c.encrypted_first_name, v_key), c.first_name) AS first_name,
        COALESCE(fn_decrypt_value(c.encrypted_last_name, v_key), c.last_name) AS last_name,
        COALESCE(fn_decrypt_value(c.encrypted_email, v_key), c.email) AS email,
        COALESCE(fn_decrypt_value(c.encrypted_contact, v_key), c.contact_no) AS contact_no,
        c.status,
        c.date_hired,
        c.last_login,
        c.is_encrypted
    FROM collector c
    WHERE c.status = 'active'
    ORDER BY c.collector_id DESC;
END$$
DELIMITER ;

-- =====================================================
-- INSPECTOR TABLE PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_inspector;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_inspector(IN p_inspector_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE inspector SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_no, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_no = '***ENCRYPTED***'
    WHERE inspector_id = p_inspector_id
    AND (is_encrypted IS NULL OR is_encrypted = 0);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_encrypt_all_inspectors;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_inspectors()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE inspector SET
        encrypted_first_name = fn_encrypt_value(first_name, v_key),
        encrypted_last_name = fn_encrypt_value(last_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_no, v_key),
        is_encrypted = 1,
        first_name = '***ENCRYPTED***',
        last_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_no = '***ENCRYPTED***'
    WHERE (is_encrypted IS NULL OR is_encrypted = 0)
    AND first_name IS NOT NULL 
    AND first_name != '***ENCRYPTED***';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_inspectors_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_inspectors_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        COALESCE(fn_decrypt_value(i.encrypted_first_name, v_key), i.first_name) AS first_name,
        COALESCE(fn_decrypt_value(i.encrypted_last_name, v_key), i.last_name) AS last_name,
        COALESCE(fn_decrypt_value(i.encrypted_email, v_key), i.email) AS email,
        COALESCE(fn_decrypt_value(i.encrypted_contact, v_key), i.contact_no) AS contact_no,
        i.branch_id,
        i.status,
        i.date_hired,
        i.last_login,
        i.is_encrypted
    FROM inspector i
    ORDER BY i.inspector_id DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_active_inspectors_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_active_inspectors_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        COALESCE(fn_decrypt_value(i.encrypted_first_name, v_key), i.first_name) AS first_name,
        COALESCE(fn_decrypt_value(i.encrypted_last_name, v_key), i.last_name) AS last_name,
        COALESCE(fn_decrypt_value(i.encrypted_email, v_key), i.email) AS email,
        COALESCE(fn_decrypt_value(i.encrypted_contact, v_key), i.contact_no) AS contact_no,
        i.branch_id,
        i.status,
        i.date_hired,
        i.last_login,
        i.is_encrypted
    FROM inspector i
    WHERE i.status = 'active'
    ORDER BY i.inspector_id DESC;
END$$
DELIMITER ;

-- =====================================================
-- SPOUSE TABLE PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_spouse;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_spouse(IN p_spouse_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE spouse SET
        encrypted_full_name = fn_encrypt_value(spouse_full_name, v_key),
        encrypted_contact = fn_encrypt_value(spouse_contact_number, v_key),
        is_encrypted = 1,
        spouse_full_name = '***ENCRYPTED***',
        spouse_contact_number = '***ENCRYPTED***'
    WHERE spouse_id = p_spouse_id
    AND (is_encrypted IS NULL OR is_encrypted = 0);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_encrypt_all_spouses;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_spouses()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE spouse SET
        encrypted_full_name = fn_encrypt_value(spouse_full_name, v_key),
        encrypted_contact = fn_encrypt_value(spouse_contact_number, v_key),
        is_encrypted = 1,
        spouse_full_name = '***ENCRYPTED***',
        spouse_contact_number = '***ENCRYPTED***'
    WHERE (is_encrypted IS NULL OR is_encrypted = 0)
    AND spouse_full_name IS NOT NULL 
    AND spouse_full_name != '***ENCRYPTED***';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_spouses_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_spouses_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        s.spouse_id,
        s.applicant_id,
        COALESCE(fn_decrypt_value(s.encrypted_full_name, v_key), s.spouse_full_name) AS spouse_full_name,
        s.spouse_birthdate,
        s.spouse_educational_attainment,
        COALESCE(fn_decrypt_value(s.encrypted_contact, v_key), s.spouse_contact_number) AS spouse_contact_number,
        s.spouse_occupation,
        s.created_at,
        s.is_encrypted
    FROM spouse s
    ORDER BY s.spouse_id DESC;
END$$
DELIMITER ;

-- =====================================================
-- STALLHOLDER TABLE PROCEDURES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_stallholder;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_stallholder(IN p_stallholder_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE stallholder SET
        encrypted_name = fn_encrypt_value(stallholder_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_number, v_key),
        encrypted_address = fn_encrypt_value(address, v_key),
        is_encrypted = 1,
        stallholder_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_number = '***ENCRYPTED***',
        address = '***ENCRYPTED***'
    WHERE stallholder_id = p_stallholder_id
    AND (is_encrypted IS NULL OR is_encrypted = 0);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_encrypt_all_stallholders;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_stallholders()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    UPDATE stallholder SET
        encrypted_name = fn_encrypt_value(stallholder_name, v_key),
        encrypted_email = fn_encrypt_value(email, v_key),
        encrypted_contact = fn_encrypt_value(contact_number, v_key),
        encrypted_address = fn_encrypt_value(address, v_key),
        is_encrypted = 1,
        stallholder_name = '***ENCRYPTED***',
        email = CONCAT(LEFT(email, 3), '***@***.***'),
        contact_number = '***ENCRYPTED***',
        address = '***ENCRYPTED***'
    WHERE (is_encrypted IS NULL OR is_encrypted = 0)
    AND stallholder_name IS NOT NULL 
    AND stallholder_name != '***ENCRYPTED***';
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_stallholders_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_stallholders_decrypted()
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        s.stallholder_id,
        s.applicant_id,
        COALESCE(fn_decrypt_value(s.encrypted_name, v_key), s.stallholder_name) AS stallholder_name,
        COALESCE(fn_decrypt_value(s.encrypted_email, v_key), s.email) AS email,
        COALESCE(fn_decrypt_value(s.encrypted_contact, v_key), s.contact_number) AS contact_number,
        COALESCE(fn_decrypt_value(s.encrypted_address, v_key), s.address) AS address,
        s.business_name,
        s.business_type,
        s.branch_id,
        b.branch_name,
        s.stall_id,
        st.stall_no AS stall_number,
        s.contract_status,
        s.payment_status,
        s.compliance_status,
        s.date_created,
        s.is_encrypted
    FROM stallholder s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN stall st ON s.stall_id = st.stall_id
    ORDER BY s.stallholder_id DESC;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_get_stallholders_by_branch_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_stallholders_by_branch_decrypted(IN p_branch_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        s.stallholder_id,
        s.applicant_id,
        COALESCE(fn_decrypt_value(s.encrypted_name, v_key), s.stallholder_name) AS stallholder_name,
        COALESCE(fn_decrypt_value(s.encrypted_email, v_key), s.email) AS email,
        COALESCE(fn_decrypt_value(s.encrypted_contact, v_key), s.contact_number) AS contact_number,
        COALESCE(fn_decrypt_value(s.encrypted_address, v_key), s.address) AS address,
        s.business_name,
        s.business_type,
        s.branch_id,
        b.branch_name,
        s.stall_id,
        st.stall_no AS stall_number,
        s.contract_status,
        s.payment_status,
        s.compliance_status,
        s.date_created,
        s.is_encrypted
    FROM stallholder s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN stall st ON s.stall_id = st.stall_id
    WHERE s.branch_id = p_branch_id
    ORDER BY s.stallholder_id DESC;
END$$
DELIMITER ;

-- =====================================================
-- STALL_BUSINESS_OWNER TABLE PROCEDURES
-- (No encrypted columns exist, so we add encryption support)
-- =====================================================

-- First, add encrypted columns if they don't exist
-- Run these ALTER statements separately if needed:
-- ALTER TABLE stall_business_owner ADD COLUMN encrypted_first_name VARBINARY(256);
-- ALTER TABLE stall_business_owner ADD COLUMN encrypted_last_name VARBINARY(256);
-- ALTER TABLE stall_business_owner ADD COLUMN encrypted_email VARBINARY(256);
-- ALTER TABLE stall_business_owner ADD COLUMN encrypted_contact VARBINARY(256);
-- ALTER TABLE stall_business_owner ADD COLUMN is_encrypted TINYINT DEFAULT 0;

DROP PROCEDURE IF EXISTS sp_get_business_owners_decrypted;
DELIMITER $$
CREATE PROCEDURE sp_get_business_owners_decrypted()
BEGIN
    -- stall_business_owner doesn't have encrypted columns yet
    -- Returns data as-is
    SELECT 
        business_owner_id,
        owner_username,
        first_name,
        last_name,
        email,
        contact_number,
        status,
        subscription_status,
        subscription_expiry_date,
        last_login,
        created_at
    FROM stall_business_owner
    ORDER BY business_owner_id DESC;
END$$
DELIMITER ;

-- =====================================================
-- MASTER ENCRYPTION PROCEDURE - ENCRYPT ALL TABLES
-- =====================================================

DROP PROCEDURE IF EXISTS sp_encrypt_all_sensitive_data;
DELIMITER $$
CREATE PROCEDURE sp_encrypt_all_sensitive_data()
BEGIN
    DECLARE exit handler FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;
    
    START TRANSACTION;
    
    CALL sp_encrypt_all_applicants();
    CALL sp_encrypt_all_business_employees();
    CALL sp_encrypt_all_business_managers();
    CALL sp_encrypt_all_collectors();
    CALL sp_encrypt_all_inspectors();
    CALL sp_encrypt_all_spouses();
    CALL sp_encrypt_all_stallholders();
    
    COMMIT;
    
    SELECT 'All sensitive data encrypted successfully!' AS result;
END$$
DELIMITER ;

-- =====================================================
-- INSERT/UPDATE PROCEDURES WITH AUTO-ENCRYPTION
-- =====================================================

-- Insert applicant with encryption
DROP PROCEDURE IF EXISTS sp_insert_applicant_encrypted;
DELIMITER $$
CREATE PROCEDURE sp_insert_applicant_encrypted(
    IN p_full_name VARCHAR(500),
    IN p_email VARCHAR(100),
    IN p_contact VARCHAR(500),
    IN p_address VARCHAR(1000),
    IN p_birthdate DATE,
    IN p_civil_status VARCHAR(20),
    IN p_education VARCHAR(100),
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    INSERT INTO applicant (
        applicant_full_name, applicant_email, applicant_contact_number, applicant_address,
        encrypted_full_name, encrypted_email, encrypted_contact, encrypted_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment,
        applicant_username, applicant_password_hash, is_encrypted, created_at
    ) VALUES (
        '***ENCRYPTED***', CONCAT(LEFT(p_email, 3), '***@***.***'), '***ENCRYPTED***', '***ENCRYPTED***',
        fn_encrypt_value(p_full_name, v_key), fn_encrypt_value(p_email, v_key),
        fn_encrypt_value(p_contact, v_key), fn_encrypt_value(p_address, v_key),
        p_birthdate, p_civil_status, p_education,
        p_username, p_password_hash, 1, NOW()
    );
    
    SELECT LAST_INSERT_ID() AS applicant_id;
END$$
DELIMITER ;

-- Insert stallholder with encryption
DROP PROCEDURE IF EXISTS sp_insert_stallholder_encrypted;
DELIMITER $$
CREATE PROCEDURE sp_insert_stallholder_encrypted(
    IN p_applicant_id INT,
    IN p_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact VARCHAR(500),
    IN p_address TEXT,
    IN p_business_name VARCHAR(500),
    IN p_business_type VARCHAR(100),
    IN p_branch_id INT,
    IN p_stall_id INT,
    IN p_created_by INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    INSERT INTO stallholder (
        applicant_id, stallholder_name, email, contact_number, address,
        encrypted_name, encrypted_email, encrypted_contact, encrypted_address,
        business_name, business_type, branch_id, stall_id,
        created_by_business_manager, is_encrypted, date_created
    ) VALUES (
        p_applicant_id, '***ENCRYPTED***', CONCAT(LEFT(p_email, 3), '***@***.***'), '***ENCRYPTED***', '***ENCRYPTED***',
        fn_encrypt_value(p_name, v_key), fn_encrypt_value(p_email, v_key),
        fn_encrypt_value(p_contact, v_key), fn_encrypt_value(p_address, v_key),
        p_business_name, p_business_type, p_branch_id, p_stall_id,
        p_created_by, 1, NOW()
    );
    
    SELECT LAST_INSERT_ID() AS stallholder_id;
END$$
DELIMITER ;

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 'All encryption/decryption procedures created successfully!' AS status;
SELECT 'Use sp_encrypt_all_sensitive_data() to encrypt existing data' AS instruction;
SELECT 'Use sp_get_*_decrypted() procedures to view decrypted data' AS usage;
