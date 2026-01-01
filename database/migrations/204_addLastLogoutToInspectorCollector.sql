-- Migration: 204_addLastLogoutToInspectorCollector.sql
-- Description: Add last_logout column to inspector and collector tables
-- Date: 2026-01-01
-- IMPORTANT: Run this in a SQL Query Tab, NOT as a stored procedure!

-- Add last_logout to inspector table
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'inspector'
    AND COLUMN_NAME = 'last_logout'
);

SET @query = IF(@col_exists = 0,
    'ALTER TABLE inspector ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL AFTER last_login',
    'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add last_logout to collector table
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'collector'
    AND COLUMN_NAME = 'last_logout'
);

SET @query = IF(@col_exists = 0,
    'ALTER TABLE collector ADD COLUMN last_logout TIMESTAMP NULL DEFAULT NULL AFTER last_login',
    'SELECT 1'
);

PREPARE stmt FROM @query;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SELECT 'Migration 204_addLastLogoutToInspectorCollector.sql completed successfully' AS status;
