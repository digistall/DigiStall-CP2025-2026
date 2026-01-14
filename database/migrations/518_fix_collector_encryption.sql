-- =============================================
-- 518: Fix Collector Encryption (Like Business Employee)
-- Store Base64-encoded AES encrypted data in VARCHAR columns
-- =============================================

DROP PROCEDURE IF EXISTS `sp_createCollectorDirect`;

DELIMITER $$
CREATE PROCEDURE `sp_createCollectorDirect`(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_middle_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500)
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
        -- Encrypt data as Base64 strings
        SET v_encrypted_first_name = TO_BASE64(AES_ENCRYPT(p_first_name, v_key));
        SET v_encrypted_last_name = TO_BASE64(AES_ENCRYPT(p_last_name, v_key));
        SET v_encrypted_middle_name = IF(p_middle_name IS NOT NULL, TO_BASE64(AES_ENCRYPT(p_middle_name, v_key)), NULL);
        SET v_encrypted_email = TO_BASE64(AES_ENCRYPT(p_email, v_key));
        SET v_encrypted_contact = TO_BASE64(AES_ENCRYPT(p_contact_no, v_key));
        
        -- Insert with encrypted data
        INSERT INTO collector (
            username,
            password_hash,
            first_name,
            last_name,
            middle_name,
            email,
            contact_no,
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
            CURDATE(),
            'active',
            1
        );
    ELSE
        -- No encryption (fallback)
        INSERT INTO collector (
            username,
            password_hash,
            first_name,
            last_name,
            middle_name,
            email,
            contact_no,
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
            CURDATE(),
            'active',
            0
        );
    END IF;
    
    SELECT LAST_INSERT_ID() as collector_id;
END$$

DELIMITER ;

-- =============================================
-- Update Collector Retrieval with Decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorByIdDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByIdDecrypted`(IN p_collector_id INT)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        -- Decrypt from Base64-encoded VARCHAR columns
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.first_name), v_key) AS CHAR(500))
        ELSE c.first_name END as first_name,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.last_name), v_key) AS CHAR(500))
        ELSE c.last_name END as last_name,
        CASE WHEN c.is_encrypted = 1 AND c.middle_name IS NOT NULL AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.middle_name), v_key) AS CHAR(500))
        ELSE c.middle_name END as middle_name,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.email), v_key) AS CHAR(500))
        ELSE c.email END as email,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.contact_no), v_key) AS CHAR(500))
        ELSE c.contact_no END as contact_no,
        c.date_hired,
        c.status
    FROM collector c
    WHERE c.collector_id = p_collector_id;
END$$

DELIMITER ;

-- =============================================
-- Update Collector List with Decryption (All Collectors)
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorsAllDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorsAllDecrypted`()
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.first_name), v_key) AS CHAR(500))
        ELSE c.first_name END as first_name,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.last_name), v_key) AS CHAR(500))
        ELSE c.last_name END as last_name,
        CASE WHEN c.is_encrypted = 1 AND c.middle_name IS NOT NULL AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.middle_name), v_key) AS CHAR(500))
        ELSE c.middle_name END as middle_name,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.email), v_key) AS CHAR(500))
        ELSE c.email END as email,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.contact_no), v_key) AS CHAR(500))
        ELSE c.contact_no END as contact_no,
        c.date_hired,
        c.status
    FROM collector c
    WHERE c.status = 'active';
END$$

DELIMITER ;

-- =============================================
-- Update Collector List by Branch with Decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorsByBranchDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.first_name), v_key) AS CHAR(500))
        ELSE c.first_name END as first_name,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.last_name), v_key) AS CHAR(500))
        ELSE c.last_name END as last_name,
        CASE WHEN c.is_encrypted = 1 AND c.middle_name IS NOT NULL AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.middle_name), v_key) AS CHAR(500))
        ELSE c.middle_name END as middle_name,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.email), v_key) AS CHAR(500))
        ELSE c.email END as email,
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(FROM_BASE64(c.contact_no), v_key) AS CHAR(500))
        ELSE c.contact_no END as contact_no,
        c.date_hired,
        c.status
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    WHERE c.status = 'active' AND ca.branch_id = p_branch_id;
END$$

DELIMITER ;

SELECT '✅ Migration 518 Complete - Collector encryption/decryption fixed!' as status;
