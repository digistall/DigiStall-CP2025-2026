-- Migration: 434_fix_manager_employee_decryption.sql
-- Description: Fix business_manager and business_employee decryption for login
-- Date: January 2026

-- =============================================
-- FIX 1: getBusinessManagerByUsername - Decrypt PII data
-- =============================================
DROP PROCEDURE IF EXISTS `getBusinessManagerByUsername`;

DELIMITER $$
CREATE PROCEDURE `getBusinessManagerByUsername`(IN p_username VARCHAR(100))
BEGIN
    DECLARE v_key VARCHAR(64);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        bm.business_manager_id,
        bm.branch_id,
        bm.manager_username,
        bm.manager_password_hash,
        -- Decrypt first_name
        CASE 
            WHEN COALESCE(bm.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND bm.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(bm.encrypted_first_name, v_key) AS CHAR(100))
            ELSE COALESCE(bm.first_name, '') 
        END as first_name,
        -- Decrypt last_name
        CASE 
            WHEN COALESCE(bm.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND bm.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(bm.encrypted_last_name, v_key) AS CHAR(100))
            ELSE COALESCE(bm.last_name, '') 
        END as last_name,
        -- Decrypt email
        CASE 
            WHEN COALESCE(bm.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND bm.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(bm.encrypted_email, v_key) AS CHAR(255))
            ELSE COALESCE(bm.email, '') 
        END as email,
        -- Decrypt contact_number
        CASE 
            WHEN COALESCE(bm.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND bm.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(bm.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(bm.contact_number, '') 
        END as contact_number,
        bm.status,
        bm.last_login,
        bm.last_logout,
        b.branch_name,
        b.area,
        b.location
    FROM business_manager bm
    LEFT JOIN branch b ON bm.branch_id = b.branch_id
    WHERE bm.manager_username = p_username COLLATE utf8mb4_general_ci
      AND bm.status = 'Active';
END$$
DELIMITER ;

-- =============================================
-- FIX 2: getBusinessEmployeeByUsername - Decrypt PII data
-- =============================================
DROP PROCEDURE IF EXISTS `getBusinessEmployeeByUsername`;

DELIMITER $$
CREATE PROCEDURE `getBusinessEmployeeByUsername`(IN p_username VARCHAR(100))
BEGIN
    DECLARE v_key VARCHAR(64);
    
    -- Get encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        be.business_employee_id,
        be.branch_id,
        be.employee_username,
        be.employee_password_hash,
        -- Decrypt first_name
        CASE 
            WHEN COALESCE(be.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND be.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(be.encrypted_first_name, v_key) AS CHAR(100))
            ELSE COALESCE(be.first_name, '') 
        END as first_name,
        -- Decrypt last_name
        CASE 
            WHEN COALESCE(be.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND be.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(be.encrypted_last_name, v_key) AS CHAR(100))
            ELSE COALESCE(be.last_name, '') 
        END as last_name,
        -- Decrypt email
        CASE 
            WHEN COALESCE(be.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND be.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(be.encrypted_email, v_key) AS CHAR(255))
            ELSE COALESCE(be.email, '') 
        END as email,
        be.phone_number,
        be.status,
        be.permissions,
        be.last_login,
        be.last_logout,
        b.branch_name
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE be.employee_username = p_username COLLATE utf8mb4_general_ci;
END$$
DELIMITER ;

