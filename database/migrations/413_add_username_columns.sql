-- =============================================
-- 413: Add Username Columns to Manager/Employee Tables
-- Also adds encrypted_* columns for sensitive data
-- Created: Auto-generated for security compliance
-- =============================================

DELIMITER $$

-- Helper procedure to add column if not exists
DROP PROCEDURE IF EXISTS add_column_if_not_exists$$
CREATE PROCEDURE add_column_if_not_exists(
  IN p_table VARCHAR(64),
  IN p_column VARCHAR(64),
  IN p_definition VARCHAR(255)
)
BEGIN
  IF NOT EXISTS (
    SELECT * FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = p_table 
    AND COLUMN_NAME = p_column
  ) THEN
    SET @sql = CONCAT('ALTER TABLE ', p_table, ' ADD COLUMN ', p_column, ' ', p_definition);
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END IF;
END$$

DELIMITER ;

-- =============================================
-- 1. ADD USERNAME TO BUSINESS_MANAGER TABLE
-- (Already has manager_username column - skip)
-- =============================================

-- =============================================
-- 2. ADD USERNAME TO BUSINESS_EMPLOYEE TABLE
-- (Already has employee_username column - skip)
-- =============================================

-- =============================================
-- 3. ADD ENCRYPTED COLUMNS TO APPLICANT TABLE
-- =============================================
CALL add_column_if_not_exists('applicant', 'encrypted_full_name', 'VARBINARY(512)');
CALL add_column_if_not_exists('applicant', 'encrypted_contact', 'VARBINARY(256)');
CALL add_column_if_not_exists('applicant', 'encrypted_email', 'VARBINARY(256)');
CALL add_column_if_not_exists('applicant', 'encrypted_address', 'VARBINARY(1024)');
CALL add_column_if_not_exists('applicant', 'encrypted_birthdate', 'VARBINARY(128)');
CALL add_column_if_not_exists('applicant', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 4. ADD ENCRYPTED COLUMNS TO STALLHOLDER TABLE
-- =============================================
CALL add_column_if_not_exists('stallholder', 'encrypted_name', 'VARBINARY(512)');
CALL add_column_if_not_exists('stallholder', 'encrypted_email', 'VARBINARY(256)');
CALL add_column_if_not_exists('stallholder', 'encrypted_contact', 'VARBINARY(256)');
CALL add_column_if_not_exists('stallholder', 'encrypted_address', 'VARBINARY(1024)');
CALL add_column_if_not_exists('stallholder', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 5. ADD ENCRYPTED COLUMNS TO CREDENTIAL TABLE
-- =============================================
CALL add_column_if_not_exists('credential', 'encrypted_username', 'VARBINARY(256)');
CALL add_column_if_not_exists('credential', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 6. ADD ENCRYPTED COLUMNS TO BUSINESS_MANAGER TABLE
-- =============================================
CALL add_column_if_not_exists('business_manager', 'encrypted_first_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('business_manager', 'encrypted_last_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('business_manager', 'encrypted_email', 'VARBINARY(256)');
CALL add_column_if_not_exists('business_manager', 'encrypted_contact', 'VARBINARY(256)');
CALL add_column_if_not_exists('business_manager', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 7. ADD ENCRYPTED COLUMNS TO BUSINESS_EMPLOYEE TABLE
-- =============================================
CALL add_column_if_not_exists('business_employee', 'encrypted_first_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('business_employee', 'encrypted_last_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('business_employee', 'encrypted_email', 'VARBINARY(512)');
CALL add_column_if_not_exists('business_employee', 'encrypted_phone', 'VARBINARY(256)');
CALL add_column_if_not_exists('business_employee', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 8. ADD ENCRYPTED COLUMNS TO INSPECTOR TABLE
-- =============================================
CALL add_column_if_not_exists('inspector', 'encrypted_first_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('inspector', 'encrypted_last_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('inspector', 'encrypted_email', 'VARBINARY(256)');
CALL add_column_if_not_exists('inspector', 'encrypted_contact', 'VARBINARY(256)');
CALL add_column_if_not_exists('inspector', 'encrypted_phone', 'VARBINARY(256)');
CALL add_column_if_not_exists('inspector', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 9. ADD ENCRYPTED COLUMNS TO COLLECTOR TABLE
-- =============================================
CALL add_column_if_not_exists('collector', 'encrypted_first_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('collector', 'encrypted_last_name', 'VARBINARY(256)');
CALL add_column_if_not_exists('collector', 'encrypted_email', 'VARBINARY(256)');
CALL add_column_if_not_exists('collector', 'encrypted_contact', 'VARBINARY(256)');
CALL add_column_if_not_exists('collector', 'encrypted_phone', 'VARBINARY(256)');
CALL add_column_if_not_exists('collector', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 10. ADD ENCRYPTED COLUMNS TO SPOUSE TABLE
-- =============================================
CALL add_column_if_not_exists('spouse', 'encrypted_full_name', 'VARBINARY(512)');
CALL add_column_if_not_exists('spouse', 'encrypted_contact', 'VARBINARY(256)');
CALL add_column_if_not_exists('spouse', 'is_encrypted', 'TINYINT DEFAULT 0');

-- =============================================
-- 11. CREATE ENCRYPTION KEY TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS encryption_keys (
  key_id INT AUTO_INCREMENT PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  encryption_key VARCHAR(64) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active TINYINT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default encryption key (SHA2 hash for AES-256)
-- IMPORTANT: Change this key in production!
INSERT IGNORE INTO encryption_keys (key_name, encryption_key) 
VALUES ('user_data_key', SHA2('DigiStall_Secure_Key_2026_Change_In_Production', 256));

-- Cleanup helper procedure
DROP PROCEDURE IF EXISTS add_column_if_not_exists;

-- Success message
SELECT '✅ Migration 413 complete - Username and encrypted columns added!' as status;
