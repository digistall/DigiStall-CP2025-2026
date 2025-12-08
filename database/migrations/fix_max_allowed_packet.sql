-- =============================================
-- FIX MYSQL MAX_ALLOWED_PACKET SIZE
-- =============================================
-- Description: Increase MySQL packet size to handle large file uploads
-- This fixes: "Got a packet bigger than 'max_allowed_packet' bytes"
-- Date: December 7, 2025
-- =============================================

-- Set max_allowed_packet to 64MB (from default 4MB)
SET GLOBAL max_allowed_packet = 67108864;

-- Verify the change
SHOW VARIABLES LIKE 'max_allowed_packet';

SELECT '✅ max_allowed_packet increased to 64MB' as Result;
SELECT 'Note: Add this to my.ini [mysqld] section for permanent fix:' as Note;
SELECT 'max_allowed_packet=64M' as Configuration;
