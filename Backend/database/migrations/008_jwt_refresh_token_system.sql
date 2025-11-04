-- ========================================
-- MIGRATION: 008_jwt_refresh_token_system.sql
-- Description: JWT Refresh Token System with Single Device Login
-- Version: 1.0.0
-- Created: 2025-11-03
-- ========================================

USE `naga_stall`;

-- Create migrations table if it doesn't exist
CREATE TABLE IF NOT EXISTS `migrations` (
    `migration_id` INT AUTO_INCREMENT PRIMARY KEY,
    `migration_name` VARCHAR(255) NOT NULL UNIQUE,
    `migration_version` VARCHAR(50) NOT NULL,
    `executed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX `idx_migration_name` (`migration_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================
-- REFRESH TOKEN MANAGEMENT TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS `refresh_tokens` (
    `token_id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL COMMENT 'User ID from respective user table',
    `user_type` ENUM('admin', 'branch_manager', 'employee') NOT NULL COMMENT 'Type of user account',
    `refresh_token` VARCHAR(512) UNIQUE NOT NULL COMMENT 'Hashed refresh token',
    `access_token_jti` VARCHAR(255) COMMENT 'JWT ID of the access token for tracking',
    `device_fingerprint` VARCHAR(255) COMMENT 'Device identifier for single device login',
    `ip_address` VARCHAR(45) COMMENT 'IP address of the login',
    `user_agent` TEXT COMMENT 'Browser/device user agent',
    `issued_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Token creation time',
    `expires_at` TIMESTAMP NOT NULL COMMENT 'Token expiration time (30 days)',
    `last_used_at` TIMESTAMP NULL COMMENT 'Last time token was used to refresh',
    `is_active` BOOLEAN DEFAULT TRUE COMMENT 'Whether token is currently active',
    `revoked_at` TIMESTAMP NULL COMMENT 'When token was revoked/logged out',
    `revoke_reason` VARCHAR(255) COMMENT 'Reason for revocation (logout, new_login, security, etc.)',
    
    INDEX `idx_user_lookup` (`user_id`, `user_type`),
    INDEX `idx_refresh_token` (`refresh_token`),
    INDEX `idx_active_tokens` (`is_active`, `expires_at`),
    INDEX `idx_device_fingerprint` (`device_fingerprint`),
    INDEX `idx_expires_at` (`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Stores refresh tokens for JWT authentication with single device login support';

-- ========================================
-- TOKEN ACTIVITY LOG
-- ========================================

CREATE TABLE IF NOT EXISTS `token_activity_log` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `token_id` INT COMMENT 'Reference to refresh_tokens table',
    `user_id` INT NOT NULL,
    `user_type` ENUM('admin', 'branch_manager', 'employee') NOT NULL,
    `activity_type` ENUM('login', 'refresh', 'logout', 'revoke', 'expire') NOT NULL,
    `ip_address` VARCHAR(45),
    `user_agent` TEXT,
    `success` BOOLEAN DEFAULT TRUE,
    `error_message` TEXT COMMENT 'Error message if activity failed',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (`token_id`) REFERENCES `refresh_tokens`(`token_id`) ON DELETE SET NULL,
    INDEX `idx_user_activity` (`user_id`, `user_type`, `created_at`),
    INDEX `idx_activity_type` (`activity_type`),
    INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci
COMMENT='Logs all token-related activities for security auditing';

-- ========================================
-- STORED PROCEDURES
-- ========================================

DELIMITER $$

-- Procedure to revoke all tokens for a user (for new login - single device)
DROP PROCEDURE IF EXISTS `revokeAllUserTokens`$$
CREATE PROCEDURE `revokeAllUserTokens`(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_revoke_reason VARCHAR(255)
)
BEGIN
    UPDATE refresh_tokens
    SET 
        is_active = FALSE,
        revoked_at = NOW(),
        revoke_reason = p_revoke_reason
    WHERE 
        user_id = p_user_id 
        AND user_type = p_user_type
        AND is_active = TRUE;
    
    -- Log the revocation
    INSERT INTO token_activity_log (user_id, user_type, activity_type, success)
    VALUES (p_user_id, p_user_type, 'revoke', TRUE);
END$$

-- Procedure to clean up expired tokens (run periodically)
DROP PROCEDURE IF EXISTS `cleanupExpiredTokens`$$
CREATE PROCEDURE `cleanupExpiredTokens`()
BEGIN
    -- Mark expired tokens as inactive
    UPDATE refresh_tokens
    SET 
        is_active = FALSE,
        revoked_at = NOW(),
        revoke_reason = 'expired'
    WHERE 
        is_active = TRUE
        AND expires_at < NOW();
    
    -- Delete old token activity logs (older than 90 days)
    DELETE FROM token_activity_log
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 90 DAY);
    
    -- Delete revoked tokens older than 7 days
    DELETE FROM refresh_tokens
    WHERE 
        is_active = FALSE
        AND revoked_at < DATE_SUB(NOW(), INTERVAL 7 DAY);
END$$

-- Procedure to get active sessions for a user
DROP PROCEDURE IF EXISTS `getUserActiveSessions`$$
CREATE PROCEDURE `getUserActiveSessions`(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50)
)
BEGIN
    SELECT 
        token_id,
        device_fingerprint,
        ip_address,
        user_agent,
        issued_at,
        expires_at,
        last_used_at
    FROM refresh_tokens
    WHERE 
        user_id = p_user_id
        AND user_type = p_user_type
        AND is_active = TRUE
        AND expires_at > NOW()
    ORDER BY issued_at DESC;
END$$

-- Procedure to revoke specific token
DROP PROCEDURE IF EXISTS `revokeToken`$$
CREATE PROCEDURE `revokeToken`(
    IN p_token_id INT,
    IN p_revoke_reason VARCHAR(255)
)
BEGIN
    UPDATE refresh_tokens
    SET 
        is_active = FALSE,
        revoked_at = NOW(),
        revoke_reason = p_revoke_reason
    WHERE token_id = p_token_id;
END$$

DELIMITER ;

-- ========================================
-- INSERT MIGRATION RECORD
-- ========================================

INSERT IGNORE INTO `migrations` (`migration_name`, `migration_version`)
VALUES ('008_jwt_refresh_token_system', '1.0.0');

-- ========================================
-- VERIFICATION QUERIES
-- ========================================

-- Verify table creation
SELECT 'refresh_tokens table created' AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'refresh_tokens';

SELECT 'token_activity_log table created' AS status
FROM information_schema.TABLES
WHERE TABLE_SCHEMA = 'naga_stall' AND TABLE_NAME = 'token_activity_log';

-- Show stored procedures
SHOW PROCEDURE STATUS WHERE Db = 'naga_stall' AND Name LIKE '%Token%';

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- This migration adds:
-- 1. refresh_tokens table for storing JWT refresh tokens
-- 2. token_activity_log for security auditing
-- 3. Stored procedures for token management
-- 4. Single device login enforcement
-- ========================================
