-- =============================================
-- 417: Decryption Procedures for Frontend Display
-- Returns decrypted data for authorized API calls
-- =============================================

DELIMITER $$

-- =============================================
-- 1. GET DECRYPTED COLLECTORS (for dashboard)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorsAllDecrypted`$$

CREATE PROCEDURE `sp_getCollectorsAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id,
    c.username,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
    ELSE c.first_name END as first_name,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
    ELSE c.last_name END as last_name,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
    ELSE c.email END as email,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
    ELSE c.contact_no END as contact_no,
    c.status,
    c.date_created,
    c.last_login,
    c.last_logout,
    ca.branch_id,
    b.branch_name
  FROM collector c
  LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
  LEFT JOIN branch b ON ca.branch_id = b.branch_id;
END$$

-- =============================================
-- 2. GET DECRYPTED COLLECTORS BY BRANCH
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getCollectorsByBranchDecrypted`$$

CREATE PROCEDURE `sp_getCollectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    c.collector_id,
    c.username,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_first_name, v_key) AS CHAR(100))
    ELSE c.first_name END as first_name,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_last_name, v_key) AS CHAR(100))
    ELSE c.last_name END as last_name,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_email, v_key) AS CHAR(255))
    ELSE c.email END as email,
    CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(c.encrypted_contact, v_key) AS CHAR(50))
    ELSE c.contact_no END as contact_no,
    c.status,
    c.date_created,
    c.last_login,
    c.last_logout,
    ca.branch_id,
    b.branch_name
  FROM collector c
  LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
  LEFT JOIN branch b ON ca.branch_id = b.branch_id
  WHERE ca.branch_id = p_branch_id;
END$$

-- =============================================
-- 3. GET DECRYPTED INSPECTORS (for dashboard)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorsAllDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
    ELSE i.first_name END as first_name,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
    ELSE i.last_name END as last_name,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
    ELSE i.email END as email,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
    ELSE i.contact_no END as contact_no,
    i.status,
    i.date_created,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id;
END$$

-- =============================================
-- 4. GET DECRYPTED INSPECTORS BY BRANCH
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getInspectorsByBranchDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
    ELSE i.first_name END as first_name,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
    ELSE i.last_name END as last_name,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_email, v_key) AS CHAR(255))
    ELSE i.email END as email,
    CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
    ELSE i.contact_no END as contact_no,
    i.status,
    i.date_created,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id
  WHERE ia.branch_id = p_branch_id;
END$$

-- =============================================
-- 5. GET DECRYPTED BUSINESS EMPLOYEES
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getBusinessEmployeesAllDecrypted`$$

CREATE PROCEDURE `sp_getBusinessEmployeesAllDecrypted`(IN p_status VARCHAR(20))
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    be.business_employee_id,
    be.employee_username,
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(be.encrypted_first_name, v_key) AS CHAR(100))
    ELSE be.first_name END as first_name,
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(be.encrypted_last_name, v_key) AS CHAR(100))
    ELSE be.last_name END as last_name,
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(be.encrypted_email, v_key) AS CHAR(255))
    ELSE be.email END as email,
    CASE WHEN be.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(be.encrypted_phone, v_key) AS CHAR(50))
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

-- =============================================
-- 6. GET DECRYPTED BUSINESS EMPLOYEES BY BRANCH
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getBusinessEmployeesByBranchDecrypted`$$

CREATE PROCEDURE `sp_getBusinessEmployeesByBranchDecrypted`(IN p_branch_ids VARCHAR(500), IN p_status VARCHAR(20))
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SET @sql = CONCAT('
    SELECT 
      be.business_employee_id,
      be.employee_username,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(be.encrypted_first_name, ''', v_key, ''') AS CHAR(100))
      ELSE be.first_name END as first_name,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(be.encrypted_last_name, ''', v_key, ''') AS CHAR(100))
      ELSE be.last_name END as last_name,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(be.encrypted_email, ''', v_key, ''') AS CHAR(255))
      ELSE be.email END as email,
      CASE WHEN be.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(be.encrypted_phone, ''', v_key, ''') AS CHAR(50))
      ELSE be.phone_number END as phone_number,
      be.branch_id,
      be.permissions,
      be.status,
      be.last_login,
      be.last_logout,
      b.branch_name
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE be.status = ''', p_status, '''
    AND FIND_IN_SET(be.branch_id, ''', p_branch_ids, ''')
  ');
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- =============================================
-- 7. GET DECRYPTED STALLHOLDERS (ALL)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getStallholdersDecrypted`$$

CREATE PROCEDURE `sp_getStallholdersDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    s.stallholder_id,
    s.applicant_id,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_name, v_key) AS CHAR(255))
    ELSE s.stallholder_name END as stallholder_name,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_contact, v_key) AS CHAR(50))
    ELSE s.contact_number END as contact_number,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_email, v_key) AS CHAR(255))
    ELSE s.email END as email,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_address, v_key) AS CHAR(500))
    ELSE s.address END as address,
    s.business_name,
    s.business_type,
    s.branch_id,
    s.stall_id,
    s.contract_start_date,
    s.contract_end_date,
    s.contract_status,
    s.lease_amount,
    s.monthly_rent,
    s.payment_status,
    b.branch_name,
    st.stall_no
  FROM stallholder s
  LEFT JOIN branch b ON s.branch_id = b.branch_id
  LEFT JOIN stall st ON s.stall_id = st.stall_id;
END$$

-- =============================================
-- 7b. GET DECRYPTED STALLHOLDERS (ALL - alias for sp_getAllStallholdersAll)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getAllStallholdersAllDecrypted`$$

CREATE PROCEDURE `sp_getAllStallholdersAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    s.stallholder_id,
    s.applicant_id,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_name, v_key) AS CHAR(255))
    ELSE s.stallholder_name END as stallholder_name,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_contact, v_key) AS CHAR(50))
    ELSE s.contact_number END as contact_number,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_email, v_key) AS CHAR(255))
    ELSE s.email END as email,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_address, v_key) AS CHAR(500))
    ELSE s.address END as address,
    s.business_name,
    s.business_type,
    s.branch_id,
    s.stall_id,
    s.contract_start_date,
    s.contract_end_date,
    s.contract_status,
    s.lease_amount,
    s.monthly_rent,
    s.payment_status,
    b.branch_name,
    st.stall_no
  FROM stallholder s
  LEFT JOIN branch b ON s.branch_id = b.branch_id
  LEFT JOIN stall st ON s.stall_id = st.stall_id;
END$$

-- =============================================
-- 7c. GET DECRYPTED STALLHOLDERS BY BRANCHES
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getAllStallholdersByBranchesDecrypted`$$

CREATE PROCEDURE `sp_getAllStallholdersByBranchesDecrypted`(IN p_branch_ids VARCHAR(500))
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SET @sql = CONCAT('
    SELECT 
      s.stallholder_id,
      s.applicant_id,
      CASE WHEN s.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(s.encrypted_name, ''', v_key, ''') AS CHAR(255))
      ELSE s.stallholder_name END as stallholder_name,
      CASE WHEN s.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(s.encrypted_contact, ''', v_key, ''') AS CHAR(50))
      ELSE s.contact_number END as contact_number,
      CASE WHEN s.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(s.encrypted_email, ''', v_key, ''') AS CHAR(255))
      ELSE s.email END as email,
      CASE WHEN s.is_encrypted = 1 AND ''', v_key, ''' IS NOT NULL THEN 
        CAST(AES_DECRYPT(s.encrypted_address, ''', v_key, ''') AS CHAR(500))
      ELSE s.address END as address,
      s.business_name,
      s.business_type,
      s.branch_id,
      s.stall_id,
      s.contract_start_date,
      s.contract_end_date,
      s.contract_status,
      s.lease_amount,
      s.monthly_rent,
      s.payment_status,
      b.branch_name,
      st.stall_no
    FROM stallholder s
    LEFT JOIN branch b ON s.branch_id = b.branch_id
    LEFT JOIN stall st ON s.stall_id = st.stall_id
    WHERE FIND_IN_SET(s.branch_id, ''', p_branch_ids, ''')
  ');
  
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

-- =============================================
-- 7d. GET DECRYPTED STALLHOLDERS BY SINGLE BRANCH (for mobile inspector)
-- =============================================
DROP PROCEDURE IF EXISTS `getStallholdersByBranchDecrypted`$$

CREATE PROCEDURE `getStallholdersByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    s.stallholder_id,
    s.applicant_id,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_name, v_key) AS CHAR(255))
    ELSE s.stallholder_name END as stallholder_name,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_contact, v_key) AS CHAR(50))
    ELSE s.contact_number END as contact_number,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_email, v_key) AS CHAR(255))
    ELSE s.email END as email,
    CASE WHEN s.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(s.encrypted_address, v_key) AS CHAR(500))
    ELSE s.address END as address,
    s.business_name,
    s.business_type,
    s.branch_id,
    s.stall_id,
    s.contract_start_date,
    s.contract_end_date,
    s.contract_status,
    s.lease_amount,
    s.monthly_rent,
    s.payment_status,
    b.branch_name,
    st.stall_no
  FROM stallholder s
  LEFT JOIN branch b ON s.branch_id = b.branch_id
  LEFT JOIN stall st ON s.stall_id = st.stall_id
  WHERE s.branch_id = p_branch_id;
END$$

-- =============================================
-- 8. GET DECRYPTED APPLICANTS
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getApplicantsDecrypted`$$

CREATE PROCEDURE `sp_getApplicantsDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    a.applicant_id,
    CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(a.encrypted_full_name, v_key) AS CHAR(255))
    ELSE a.applicant_full_name END as applicant_full_name,
    CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(a.encrypted_contact, v_key) AS CHAR(50))
    ELSE a.applicant_contact_number END as applicant_contact_number,
    CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(a.encrypted_email, v_key) AS CHAR(255))
    ELSE a.applicant_email END as applicant_email,
    CASE WHEN a.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(a.encrypted_address, v_key) AS CHAR(500))
    ELSE a.applicant_address END as applicant_address,
    a.applicant_birthdate,
    a.applicant_civil_status,
    a.applicant_educational_attainment,
    a.created_at,
    a.updated_at
  FROM applicant a;
END$$

-- =============================================
-- 9. GET DECRYPTED STALLHOLDERS FOR PAYMENT (sp_get_all_stallholders replacement)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_get_all_stallholders_decrypted`$$

CREATE PROCEDURE `sp_get_all_stallholders_decrypted`(IN `p_branch_id` INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        sh.stallholder_id as id,
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END as name,
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
        ELSE sh.contact_number END as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.payment_status as paymentStatus,
        sh.contract_start_date as contract_start_date,
        sh.last_payment_date as last_payment_date
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
      AND sh.contract_status = 'Active'
      AND sh.payment_status != 'paid'
    ORDER BY sh.stallholder_name ASC;
END$$

-- =============================================
-- 10. GET DECRYPTED STALLHOLDER DETAILS
-- =============================================
DROP PROCEDURE IF EXISTS `sp_get_stallholder_details_decrypted`$$

CREATE PROCEDURE `sp_get_stallholder_details_decrypted`(IN `p_stallholder_id` INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT
        sh.stallholder_id as id,
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END as name,
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
        ELSE sh.contact_number END as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.contract_status as contractStatus,
        sh.payment_status as paymentStatus,
        sh.contract_start_date as contract_start_date,
        sh.last_payment_date as last_payment_date,
        'success' as status
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND sh.contract_status = 'Active';
END$$

-- =============================================
-- 11. GET DECRYPTED BUSINESS MANAGERS
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getBusinessManagersAllDecrypted`$$

CREATE PROCEDURE `sp_getBusinessManagersAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    bm.business_manager_id,
    bm.manager_username,
    CASE WHEN bm.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(bm.encrypted_first_name, v_key) AS CHAR(100))
    ELSE bm.first_name END as first_name,
    CASE WHEN bm.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(bm.encrypted_last_name, v_key) AS CHAR(100))
    ELSE bm.last_name END as last_name,
    CASE WHEN bm.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(bm.encrypted_email, v_key) AS CHAR(255))
    ELSE bm.email END as email,
    CASE WHEN bm.is_encrypted = 1 AND v_key IS NOT NULL THEN 
      CAST(AES_DECRYPT(bm.encrypted_contact, v_key) AS CHAR(50))
    ELSE bm.contact_number END as contact_number,
    bm.branch_id,
    bm.status,
    bm.permissions,
    bm.date_created,
    bm.last_login,
    b.branch_name
  FROM business_manager bm
  LEFT JOIN branch b ON bm.branch_id = b.branch_id;
END$$

-- =============================================
-- 12. DECRYPTION FUNCTION FOR INLINE USE
-- Returns decrypted value for a given encrypted column
-- =============================================
DROP FUNCTION IF EXISTS `fn_decrypt_value`$$

CREATE FUNCTION `fn_decrypt_value`(
  p_encrypted_value VARBINARY(1024),
  p_plain_value VARCHAR(500),
  p_is_encrypted TINYINT
) RETURNS VARCHAR(500)
DETERMINISTIC
READS SQL DATA
BEGIN
  DECLARE v_key VARCHAR(64);
  DECLARE v_result VARCHAR(500);
  
  IF p_is_encrypted = 1 THEN
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    IF v_key IS NOT NULL AND p_encrypted_value IS NOT NULL THEN
      SET v_result = CAST(AES_DECRYPT(p_encrypted_value, v_key) AS CHAR(500));
    ELSE
      SET v_result = p_plain_value;
    END IF;
  ELSE
    SET v_result = p_plain_value;
  END IF;
  
  RETURN v_result;
END$$

DELIMITER ;

SELECT '✅ Migration 417 complete - Decryption procedures for frontend ready!' as status;
