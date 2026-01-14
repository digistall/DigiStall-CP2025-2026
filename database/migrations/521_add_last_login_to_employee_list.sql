-- =============================================
-- 521: Add last_login to Inspector/Collector Employee Lists
-- Updates sp_getInspectorsAllDecrypted and sp_getCollectorsAllDecrypted
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
        i.last_login,
        i.last_logout,
        b.branch_name
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.status = 'active';
END$$

DELIMITER ;

-- =============================================
-- Update Inspector List by Branch with last_login
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
        i.last_login,
        i.last_logout,
        b.branch_name
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.branch_id = p_branch_id AND i.status = 'active';
END$$

DELIMITER ;

-- =============================================
-- Update Collector List with last_login
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
        c.status,
        c.last_login,
        c.last_logout
    FROM collector c
    WHERE c.status = 'active';
END$$

DELIMITER ;

-- =============================================
-- Update Collector List by Branch with last_login
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
        c.status,
        c.last_login,
        c.last_logout
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id
    WHERE ca.branch_id = p_branch_id AND c.status = 'active';
END$$

DELIMITER ;

SELECT '✅ Migration 521 Complete - Last login now included in employee management lists!' as status;
