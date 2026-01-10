-- =============================================
-- 516: Update Business Employee List Stored Procedures
-- Updates decryption to read from VARCHAR columns (Base64-encoded)
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getBusinessEmployeesAllDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getBusinessEmployeesAllDecrypted`(IN p_status VARCHAR(20))
BEGIN
  DECLARE v_key VARCHAR(255);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    be.business_employee_id,
    be.employee_username,
    -- Decrypt from VARCHAR columns (Base64-encoded AES encrypted data)
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(FROM_BASE64(be.first_name), v_key) AS CHAR(500))
    ELSE be.first_name END as first_name,
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(FROM_BASE64(be.last_name), v_key) AS CHAR(500))
    ELSE be.last_name END as last_name,
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(FROM_BASE64(be.email), v_key) AS CHAR(500))
    ELSE be.email END as email,
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(FROM_BASE64(be.phone_number), v_key) AS CHAR(500))
    ELSE be.phone_number END as phone_number,
    be.branch_id,
    be.permissions,
    be.status,
    be.last_login,
    be.last_logout,
    b.branch_name
  FROM business_employee be
  LEFT JOIN branch b ON be.branch_id = b.branch_id
  WHERE be.status = p_status;
END$$

DELIMITER ;

-- =============================================
-- Update Branch-Specific Employee List
-- =============================================

DROP PROCEDURE IF EXISTS `sp_getBusinessEmployeesByBranchDecrypted`;

DELIMITER $$
CREATE PROCEDURE `sp_getBusinessEmployeesByBranchDecrypted`(IN p_branch_ids VARCHAR(500), IN p_status VARCHAR(20))
BEGIN
  DECLARE v_key VARCHAR(255);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SET @sql = CONCAT('
    SELECT 
      be.business_employee_id,
      be.employee_username,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(FROM_BASE64(be.first_name), ''', v_key, ''') AS CHAR(500))
      ELSE be.first_name END as first_name,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(FROM_BASE64(be.last_name), ''', v_key, ''') AS CHAR(500))
      ELSE be.last_name END as last_name,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(FROM_BASE64(be.email), ''', v_key, ''') AS CHAR(500))
      ELSE be.email END as email,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(FROM_BASE64(be.phone_number), ''', v_key, ''') AS CHAR(500))
      ELSE be.phone_number END as phone_number,
      be.branch_id,
      be.permissions,
      be.status,
      be.last_login,
      be.last_logout,
      b.branch_name
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE be.status = ''', p_status, ''' AND FIND_IN_SET(be.branch_id, ''', p_branch_ids, ''')
  ');
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;

SELECT '✅ Migration 516 Complete - Employee list stored procedures now decrypt from VARCHAR columns!' as status;
