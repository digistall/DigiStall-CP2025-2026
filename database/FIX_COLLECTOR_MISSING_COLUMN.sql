-- =====================================================
-- FIX: Add missing last_logout column to collector table
-- =====================================================

-- Add last_logout column if it doesn't exist
ALTER TABLE collector ADD COLUMN IF NOT EXISTS last_logout TIMESTAMP NULL DEFAULT NULL AFTER last_login;

-- Verify the column was added
SELECT 'Column added successfully!' as status;
DESCRIBE collector;
