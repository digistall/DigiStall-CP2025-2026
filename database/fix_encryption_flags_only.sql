-- =============================================
-- RESTORE: Just Set is_encrypted Flag (Don't Re-encrypt!)
-- The data is already in correct Base64 format
-- =============================================

-- Fix inspector ID 4 - just set the flag
UPDATE inspector
SET is_encrypted = 1
WHERE inspector_id = 4;

-- Fix collector ID 5 - just set the flag
UPDATE collector
SET is_encrypted = 1
WHERE collector_id = 5;

SELECT 'Fixed encryption flags for Inspector ID 4 and Collector ID 5!' as status;
