-- =============================================
-- 514: Fix createBusinessEmployee to Encrypt Names
-- Updates stored procedure to encrypt first_name and last_name
-- =============================================

DROP PROCEDURE IF EXISTS `createBusinessEmployee`;

DELIMITER $$
CREATE PROCEDURE `createBusinessEmployee` (
  IN `p_username` VARCHAR(50), 
  IN `p_password_hash` VARCHAR(255), 
  IN `p_first_name` VARCHAR(500), 
  IN `p_last_name` VARCHAR(500), 
  IN `p_email` VARCHAR(500), 
  IN `p_phone_number` VARCHAR(500), 
  IN `p_branch_id` INT, 
  IN `p_created_by_manager` INT, 
  IN `p_permissions` JSON
)
BEGIN
  DECLARE v_key VARCHAR(255);
  DECLARE v_employee_id INT;
  DECLARE v_masked_first_name VARCHAR(500);
  DECLARE v_masked_last_name VARCHAR(500);
  DECLARE v_masked_email VARCHAR(500);
  DECLARE v_masked_phone VARCHAR(500);
  DECLARE v_has_key INT DEFAULT 0;
  
  -- Check if encryption is available
  SELECT COUNT(*) INTO v_has_key FROM information_schema.TABLES 
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'encryption_keys';
  
  IF v_has_key > 0 THEN
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
  END IF;
  
  IF v_key IS NOT NULL THEN
    -- Encrypt data directly into VARCHAR columns (like collector table)
    SET v_masked_first_name = TO_BASE64(AES_ENCRYPT(p_first_name, v_key));
    SET v_masked_last_name = TO_BASE64(AES_ENCRYPT(p_last_name, v_key));
    SET v_masked_email = TO_BASE64(AES_ENCRYPT(p_email, v_key));
    SET v_masked_phone = TO_BASE64(AES_ENCRYPT(p_phone_number, v_key));
    
    -- Insert with encrypted data in plain VARCHAR columns
    INSERT INTO `business_employee` (
      `employee_username`, `employee_password_hash`, 
      `first_name`, `last_name`, `email`, `phone_number`, 
      `branch_id`, `created_by_manager`, `permissions`, `status`, `password_reset_required`,
      `is_encrypted`
    )
    VALUES (
      p_username, p_password_hash, 
      v_masked_first_name, v_masked_last_name, v_masked_email, v_masked_phone,
      p_branch_id, p_created_by_manager, p_permissions, 'Active', true,
      1
    );
  ELSE
    -- No encryption (fallback)
    INSERT INTO `business_employee` (
      `employee_username`, `employee_password_hash`, 
      `first_name`, `last_name`, `email`, `phone_number`, 
      `branch_id`, `created_by_manager`, `permissions`, `status`, `password_reset_required`,
      `is_encrypted`
    )
    VALUES (
      p_username, p_password_hash, 
      p_first_name, p_last_name, p_email, p_phone_number,
      p_branch_id, p_created_by_manager, p_permissions, 'Active', true,
      0
    );
  END IF;
  
  SET v_employee_id = LAST_INSERT_ID();
  
  SELECT v_employee_id as business_employee_id;
END$$

DELIMITER ;

SELECT '✅ Migration 514 Complete - createBusinessEmployee now encrypts first_name and last_name!' as status;
