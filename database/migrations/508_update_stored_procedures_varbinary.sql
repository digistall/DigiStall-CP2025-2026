-- =============================================
-- 508: Update Stored Procedures for VARBINARY Columns
-- Fix decryption to work with VARBINARY encrypted columns
-- =============================================

DELIMITER $$

-- =============================================
-- Update sp_getInspectorByUsername
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
        -- Decrypt data directly (columns are now VARBINARY)
        CAST(AES_DECRYPT(i.first_name, v_key) AS CHAR) as first_name,
        CAST(AES_DECRYPT(i.last_name, v_key) AS CHAR) as last_name,
        i.middle_name,
        CAST(AES_DECRYPT(i.email, v_key) AS CHAR) as email,
        CASE 
            WHEN i.contact_no IS NOT NULL 
            THEN CAST(AES_DECRYPT(i.contact_no, v_key) AS CHAR)
            ELSE NULL 
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
       OR CAST(AES_DECRYPT(i.email, v_key) AS CHAR) = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$

-- =============================================
-- Update sp_getCollectorByUsername
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
        -- Decrypt data directly (columns are now VARBINARY)
        CAST(AES_DECRYPT(c.first_name, v_key) AS CHAR) as first_name,
        CAST(AES_DECRYPT(c.last_name, v_key) AS CHAR) as last_name,
        c.middle_name,
        CAST(AES_DECRYPT(c.email, v_key) AS CHAR) as email,
        CASE 
            WHEN c.contact_no IS NOT NULL 
            THEN CAST(AES_DECRYPT(c.contact_no, v_key) AS CHAR)
            ELSE NULL 
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
       OR CAST(AES_DECRYPT(c.email, v_key) AS CHAR) = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END$$

DELIMITER ;

-- =============================================
-- Test the updated procedures
-- =============================================
SELECT 'Testing Inspector Decryption:' as test;
CALL sp_getInspectorByUsername('INS1731');

SELECT 'Testing Collector Decryption:' as test;
CALL sp_getCollectorByUsername('COL3126');

-- =============================================
-- DONE!
-- Stored procedures now properly decrypt VARBINARY columns
-- =============================================
