-- =============================================
-- Fix Encryption Flag for Specific Inspector and Collector Records
-- Sets is_encrypted = 1 for inspector ID 4 and collector ID 5
-- =============================================

-- Fix inspector ID 4
UPDATE inspector
SET is_encrypted = 1
WHERE inspector_id = 4;

-- Fix collector ID 5  
UPDATE collector
SET is_encrypted = 1
WHERE collector_id = 5;

SELECT 'Inspector ID 4 and Collector ID 5 encryption flags updated successfully!' as status;
