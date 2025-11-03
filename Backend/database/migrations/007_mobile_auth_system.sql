-- ========================================
-- MIGRATION: 007_mobile_auth_system.sql
-- Description: Add mobile authentication fields to applicant table
-- Version: 1.0.0
-- Created: 2025-11-01
-- ========================================

USE `naga_stall`;

-- Check if this migration has already been run
SET @migration_name = '007_mobile_auth_system';
SET @migration_exists = (SELECT COUNT(*) FROM `migrations` WHERE `migration_name` = @migration_name);

-- Only execute if migration hasn't been run
SET @sql = IF(@migration_exists = 0, 
    'INSERT INTO migrations (migration_name, version) VALUES (''007_mobile_auth_system'', ''1.0.0'')', 
    'SELECT ''Migration already executed'' AS message'
);

-- Add authentication fields to applicant table
ALTER TABLE `applicant` 
ADD COLUMN IF NOT EXISTS `applicant_username` VARCHAR(50) UNIQUE NULL COMMENT 'Mobile login username',
ADD COLUMN IF NOT EXISTS `applicant_email` VARCHAR(100) UNIQUE NULL COMMENT 'Mobile login email',
ADD COLUMN IF NOT EXISTS `applicant_password_hash` VARCHAR(255) NULL COMMENT 'Hashed password for mobile login',
ADD COLUMN IF NOT EXISTS `email_verified` BOOLEAN DEFAULT FALSE COMMENT 'Email verification status',
ADD COLUMN IF NOT EXISTS `last_login` TIMESTAMP NULL COMMENT 'Last login timestamp',
ADD COLUMN IF NOT EXISTS `login_attempts` INT DEFAULT 0 COMMENT 'Failed login attempts counter',
ADD COLUMN IF NOT EXISTS `account_locked_until` TIMESTAMP NULL COMMENT 'Account lock expiration time';

-- Add indexes for performance
ALTER TABLE `applicant`
ADD INDEX IF NOT EXISTS `idx_applicant_username` (`applicant_username`),
ADD INDEX IF NOT EXISTS `idx_applicant_email` (`applicant_email`);

-- Create mobile session table for token management
CREATE TABLE IF NOT EXISTS `mobile_session` (
    `session_id` INT AUTO_INCREMENT PRIMARY KEY,
    `applicant_id` INT NOT NULL,
    `token_hash` VARCHAR(255) NOT NULL,
    `device_info` TEXT,
    `ip_address` VARCHAR(45),
    `expires_at` TIMESTAMP NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `last_accessed` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY `fk_mobile_session_applicant` (`applicant_id`),
    KEY `idx_token_hash` (`token_hash`),
    KEY `idx_expires_at` (`expires_at`),
    CONSTRAINT `fk_mobile_session_applicant` FOREIGN KEY (`applicant_id`) REFERENCES `applicant` (`applicant_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert sample mobile users for testing
-- Password: 'password123' hashed with bcrypt
INSERT IGNORE INTO `applicant` (
    `applicant_full_name`, 
    `applicant_contact_number`, 
    `applicant_address`, 
    `applicant_username`, 
    `applicant_email`, 
    `applicant_password_hash`,
    `email_verified`
) VALUES 
(
    'John Doe Mobile User', 
    '09123456789', 
    'Sample Address, Naga City', 
    '25-93276', 
    'john.mobile@example.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    TRUE
),
(
    'Jane Smith Mobile User', 
    '09987654321', 
    'Another Address, Naga City', 
    'jane123', 
    'jane.mobile@example.com', 
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password123
    TRUE
);

-- Record migration execution
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Success message
SELECT 'Mobile authentication system migration completed successfully' AS result;