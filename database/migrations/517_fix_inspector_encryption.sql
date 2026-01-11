-- =============================================
-- 517: Fix Inspector Encryption (Like Business Employee)
-- Store Base64-encoded AES encrypted data in VARCHAR columns
-- =============================================

DROP PROCEDURE IF EXISTS `sp_createInspectorDirect`;

DELIMITER $$
CREATE PROCEDURE `sp_createInspectorDirect`(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_middle_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500),
    IN p_branch_id INT
)
BEGIN
    DECLARE v_key VARCHAR(255);
    DECLARE v_encrypted_first_name VARCHAR(500);
    DECLARE v_encrypted_last_name VARCHAR(500);
    DECLARE v_encrypted_middle_name VARCHAR(500);
    DECLARE v_encrypted_email VARCHAR(500);
    DECLARE v_encrypted_contact VARCHAR(500);
    DECLARE v_has_key INT DEFAULT 0;
    
    -- Check if encryption is available
    SELECT COUNT(*) INTO v_has_key FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'encryption_keys';
    
    IF v_has_key > 0 THEN
        SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    END IF;
    
    IF v_key IS NOT NULL THEN
        -- Encrypt data as Base64 strings (like collector table)
        SET v_encrypted_first_name = TO_BASE64(AES_ENCRYPT(p_first_name, v_key));
        SET v_encrypted_last_name = TO_BASE64(AES_ENCRYPT(p_last_name, v_key));
        SET v_encrypted_middle_name = IF(p_middle_name IS NOT NULL, TO_BASE64(AES_ENCRYPT(p_middle_name, v_key)), NULL);
        SET v_encrypted_email = TO_BASE64(AES_ENCRYPT(p_email, v_key));
        SET v_encrypted_contact = TO_BASE64(AES_ENCRYPT(p_contact_no, v_key));
        
        -- Insert with encrypted data
        INSERT INTO inspector (
            username, 
            password,
            first_name, 
            last_name, 
            middle_name, 
            email, 
            contact_no,
            branch_id,
            date_hired,
            status,
            is_encrypted
        ) VALUES (
            p_username,
            p_password_hash,
            v_encrypted_first_name,
            v_encrypted_last_name,
            v_encrypted_middle_name,
            v_encrypted_email,
            v_encrypted_contact,
            p_branch_id,
            CURDATE(),
            'active',
            1
        );
    ELSE
        -- No encryption (fallback)
        INSERT INTO inspector (
            username, 
            password,
            first_name, 
            last_name, 
            middle_name, 
            email, 
            contact_no,
            branch_id,
            date_hired,
            status,
            is_encrypted
        ) VALUES (
            p_username,
            p_password_hash,
            p_first_name,
            p_last_name,
            p_middle_name,
            p_email,
            p_contact_no,
            p_branch_id,
            CURDATE(),
            'active',
            0
        );
    END IF;
    
    SELECT LAST_INSERT_ID() as inspector_id;
END$$

DELIMITER ;

-- =============================================
-- Update Inspector Retrieval with Decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getInspectorByIdDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByIdDecrypted`(IN p_inspector_id INT)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        i.branch_id,
        -- Decrypt from Base64-encoded VARCHAR columns
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.first_name), v_key) AS CHAR(500))
        ELSE i.first_name END as first_name,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.last_name), v_key) AS CHAR(500))
        ELSE i.last_name END as last_name,
        CASE WHEN i.is_encrypted = 1 AND i.middle_name IS NOT NULL AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.middle_name), v_key) AS CHAR(500))
        ELSE i.middle_name END as middle_name,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.email), v_key) AS CHAR(500))
        ELSE i.email END as email,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.contact_no), v_key) AS CHAR(500))
        ELSE i.contact_no END as contact_no,
        i.date_hired,
        i.status,
        b.branch_name
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.inspector_id = p_inspector_id;
END$$

DELIMITER ;

-- =============================================
-- Update Inspector List with Decryption (All Inspectors)
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getInspectorsAllDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorsAllDecrypted`()
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        i.branch_id,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.first_name), v_key) AS CHAR(500))
        ELSE i.first_name END as first_name,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.last_name), v_key) AS CHAR(500))
        ELSE i.last_name END as last_name,
        CASE WHEN i.is_encrypted = 1 AND i.middle_name IS NOT NULL AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.middle_name), v_key) AS CHAR(500))
        ELSE i.middle_name END as middle_name,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.email), v_key) AS CHAR(500))
        ELSE i.email END as email,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.contact_no), v_key) AS CHAR(500))
        ELSE i.contact_no END as contact_no,
        i.date_hired,
        i.status,
        b.branch_name
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.status = 'active';
END$$

DELIMITER ;

-- =============================================
-- Update Inspector List by Branch with Decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getInspectorsByBranchDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        i.branch_id,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.first_name), v_key) AS CHAR(500))
        ELSE i.first_name END as first_name,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.last_name), v_key) AS CHAR(500))
        ELSE i.last_name END as last_name,
        CASE WHEN i.is_encrypted = 1 AND i.middle_name IS NOT NULL AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.middle_name), v_key) AS CHAR(500))
        ELSE i.middle_name END as middle_name,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.email), v_key) AS CHAR(500))
        ELSE i.email END as email,
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(i.contact_no), v_key) AS CHAR(500))
        ELSE i.contact_no END as contact_no,
        i.date_hired,
        i.status,
        b.branch_name
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.status = 'active' AND i.branch_id = p_branch_id;
END$$

DELIMITER ;

SELECT '✅ Migration 517 Complete - Inspector encryption/decryption fixed!' as status;
