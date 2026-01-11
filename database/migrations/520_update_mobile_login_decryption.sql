-- =============================================
-- 520: Update Mobile Inspector/Collector Login with Base64 Decryption
-- Updates sp_getInspectorByUsername and sp_getCollectorByUsername
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getInspectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getInspectorByUsername`(IN p_username VARCHAR(50))
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        i.inspector_id,
        i.username,
        i.password as password_hash,
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
        b.branch_name,
        b.area,
        b.location
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci;
END$$

DELIMITER ;

-- =============================================
-- Update Collector Login with Base64 Decryption
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getCollectorByUsername`;

DELIMITER $$
CREATE PROCEDURE `sp_getCollectorByUsername`(IN p_username VARCHAR(50))
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
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
    WHERE c.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci;
END$$

DELIMITER ;

SELECT '✅ Migration 520 Complete - Mobile inspector/collector login now decrypts Base64 data!' as status;
