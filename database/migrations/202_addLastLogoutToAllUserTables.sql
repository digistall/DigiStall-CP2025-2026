-- Migration: 202_addLastLogoutToAllUserTables.sql
-- Description: Add last_logout column to credential, business_manager, and stall_business_owner tables
-- Date: 2026-01-01
-- IMPORTANT: Run this in a SQL Query Tab, NOT as a stored procedure!

-- Add last_logout to credential (mobile users)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'credential' 
    AND COLUMN_NAME = 'last_logout'
);

SET @query = IF(@col_exists = 0,
    'ALTER TABLE credential ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL AFTER last_login',
    'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_login to business_manager
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'business_manager' 
    AND COLUMN_NAME = 'last_login'
);

SET @query = IF(@col_exists = 0,
    'ALTER TABLE business_manager ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
    'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_logout to business_manager
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'business_manager' 
    AND COLUMN_NAME = 'last_logout'
);

SET @query = IF(@col_exists = 0,
    'ALTER TABLE business_manager ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
    'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_login to stall_business_owner
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'stall_business_owner' 
    AND COLUMN_NAME = 'last_login'
);

SET @query = IF(@col_exists = 0,
    'ALTER TABLE stall_business_owner ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
    'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_logout to stall_business_owner
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'stall_business_owner' 
    AND COLUMN_NAME = 'last_logout'
);

SET @query = IF(@col_exists = 0,
    'ALTER TABLE stall_business_owner ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL AFTER updated_at',
    'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration 202_addLastLogoutToAllUserTables.sql completed successfully' AS status;
