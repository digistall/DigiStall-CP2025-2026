-- =============================================
-- 513: Fix getBusinessEmployeeById Stored Procedure
-- Fixes column name errors
-- =============================================

DROP PROCEDURE IF EXISTS `getBusinessEmployeeById`;

DELIMITER $$
CREATE PROCEDURE `getBusinessEmployeeById`(IN p_employee_id INT)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    SELECT 
        e.business_employee_id,
        e.branch_id,
        e.employee_username as username,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_first_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_first_name, v_key) AS CHAR(500))
            ELSE e.first_name 
        END as first_name,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_last_name IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_last_name, v_key) AS CHAR(500))
            ELSE e.last_name 
        END as last_name,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_email IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_email, v_key) AS CHAR(500))
            ELSE e.email 
        END as email,
        CASE 
            WHEN e.is_encrypted = 1 AND e.encrypted_phone IS NOT NULL 
            THEN CAST(AES_DECRYPT(e.encrypted_phone, v_key) AS CHAR(500))
            ELSE e.phone_number 
        END as phone_number,
        e.permissions,
        e.status,
        e.last_login,
        e.created_by_manager,
        e.created_at,
        e.updated_at,
        b.branch_name,
        bm.first_name as created_by_first_name,
        bm.last_name as created_by_last_name
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id
    LEFT JOIN business_manager bm ON e.created_by_manager = bm.business_manager_id
    WHERE e.business_employee_id = p_employee_id;
END$$

DELIMITER ;

SELECT '✅ Migration 513 Complete - getBusinessEmployeeById fixed!' as status;
