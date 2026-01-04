-- =====================================================
-- Migration 326: Fix business_manager missing columns and auth SPs
-- Purpose: Add last_login and last_logout columns to business_manager table
--          Also fix stall_business_owner if missing these columns
-- =====================================================

-- Add last_login column to business_manager if it doesn't exist
SET @dbname = DATABASE();
SET @tablename = 'business_manager';
SET @columnname = 'last_login';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE business_manager ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_logout column to business_manager if it doesn't exist
SET @columnname = 'last_logout';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE business_manager ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_login column to stall_business_owner if it doesn't exist
SET @tablename = 'stall_business_owner';
SET @columnname = 'last_login';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE stall_business_owner ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_logout column to stall_business_owner if it doesn't exist
SET @columnname = 'last_logout';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE stall_business_owner ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_login column to system_administrator if it doesn't exist
SET @tablename = 'system_administrator';
SET @columnname = 'last_login';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE system_administrator ADD COLUMN last_login TIMESTAMP NULL DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_logout column to system_administrator if it doesn't exist
SET @columnname = 'last_logout';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE system_administrator ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Add last_logout column to business_employee if it doesn't exist
SET @tablename = 'business_employee';
SET @columnname = 'last_logout';
SET @preparedStatement = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = @dbname
     AND TABLE_NAME = @tablename
     AND COLUMN_NAME = @columnname) > 0,
    'SELECT 1',
    'ALTER TABLE business_employee ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Success message
SELECT 'Migration 326: Added missing last_login and last_logout columns to auth tables' as status;
