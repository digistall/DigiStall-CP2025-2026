-- =============================================
-- 421: Debug and Fix Inspector Display Issue
-- Some inspectors not showing in dashboard
-- =============================================

-- First, let's see all inspectors with their full data
SELECT 
    'DEBUG: All inspectors raw data' as info;

SELECT 
    inspector_id,
    username,
    first_name,
    last_name,
    status,
    is_encrypted,
    encrypted_first_name IS NOT NULL as has_encrypted_first,
    encrypted_last_name IS NOT NULL as has_encrypted_last
FROM inspector;

-- Check inspector assignments
SELECT 
    'DEBUG: Inspector assignments' as info;

SELECT 
    i.inspector_id,
    i.first_name,
    i.last_name,
    i.status as inspector_status,
    ia.branch_id,
    ia.status as assignment_status,
    b.branch_name
FROM inspector i
LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id
LEFT JOIN branch b ON ia.branch_id = b.branch_id;

-- Fix inspectors that were never encrypted (have NULL in encrypted columns)
-- First, encrypt their data using the active encryption key
SET @enc_key = (SELECT encryption_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1);

-- Encrypt inspectors who have NULL encrypted columns but have plain text data
UPDATE inspector 
SET 
    encrypted_first_name = AES_ENCRYPT(first_name, @enc_key),
    encrypted_last_name = AES_ENCRYPT(last_name, @enc_key),
    encrypted_contact = AES_ENCRYPT(contact_no, @enc_key),
    encrypted_email = AES_ENCRYPT(email, @enc_key),
    is_encrypted = 1
WHERE 
    inspector_id > 0
    AND encrypted_first_name IS NULL 
    AND first_name IS NOT NULL 
    AND @enc_key IS NOT NULL;

-- For any remaining NULL is_encrypted values, set to 0
UPDATE inspector 
SET is_encrypted = 0 
WHERE inspector_id > 0 AND is_encrypted IS NULL;

-- Verify the fix
SELECT 
    'AFTER FIX: All inspectors is_encrypted status' as info;

SELECT 
    inspector_id,
    first_name,
    last_name,
    status,
    is_encrypted
FROM inspector;

-- Test the decryption procedure
SELECT 
    'TEST: sp_getInspectorsAllDecrypted results' as info;

DELIMITER $$

-- Make sure procedure handles all cases
DROP PROCEDURE IF EXISTS `sp_getInspectorsAllDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsAllDecrypted`()
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.first_name, '') 
    END as first_name,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.last_name, '') 
    END as last_name,
    i.email as email,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(i.contact_no, '') 
    END as contact_no,
    i.status,
    i.date_hired,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id;
END$$

DROP PROCEDURE IF EXISTS `sp_getInspectorsByBranchDecrypted`$$

CREATE PROCEDURE `sp_getInspectorsByBranchDecrypted`(IN p_branch_id INT)
BEGIN
  DECLARE v_key VARCHAR(64);
  
  SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  
  SELECT 
    i.inspector_id,
    i.username,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.first_name, '') 
    END as first_name,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
      ELSE COALESCE(i.last_name, '') 
    END as last_name,
    i.middle_name,
    i.email,
    CASE 
      WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
        CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
      ELSE COALESCE(i.contact_no, '') 
    END as contact_no,
    i.date_hired,
    i.status,
    i.last_login,
    i.last_logout,
    ia.branch_id,
    b.branch_name
  FROM inspector i
  LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
  LEFT JOIN branch b ON ia.branch_id = b.branch_id
  WHERE ia.branch_id = p_branch_id
  ORDER BY i.date_hired DESC;
END$$

DELIMITER ;

-- Now call the procedure to verify it works
CALL sp_getInspectorsAllDecrypted();

SELECT '✅ Migration 421 complete - Inspector display issue fixed!' as status;
