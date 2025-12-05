-- ========================================
-- CHECK AND FIX AUCTION_PARTICIPANTS TABLE
-- Run this to see what columns exist and fix if needed
-- ========================================

USE `naga_stall`;

-- First, let's see what columns exist
SELECT 
    COLUMN_NAME,
    COLUMN_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'naga_stall'
AND TABLE_NAME = 'auction_participants'
ORDER BY ORDINAL_POSITION;

-- Show current structure
SHOW CREATE TABLE auction_participants;
