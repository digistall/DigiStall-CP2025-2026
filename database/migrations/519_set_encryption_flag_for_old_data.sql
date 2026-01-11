-- =============================================
-- 519: Set is_encrypted Flag for Old Inspector/Collector Data
-- Marks existing encrypted data so decryption procedures work
-- =============================================

-- Disable safe update mode temporarily
SET SQL_SAFE_UPDATES = 0;

-- Update inspector records that have Base64-encoded encrypted data
UPDATE inspector
SET is_encrypted = 1
WHERE is_encrypted = 0 
  AND first_name REGEXP '^[A-Za-z0-9+/]+=*$'
  AND LENGTH(first_name) > 20;

-- Update collector records that have Base64-encoded encrypted data  
UPDATE collector
SET is_encrypted = 1
WHERE is_encrypted = 0
  AND first_name REGEXP '^[A-Za-z0-9+/]+=*$'
  AND LENGTH(first_name) > 20;

-- Re-enable safe update mode
SET SQL_SAFE_UPDATES = 1;

SELECT 
    CONCAT('✅ Updated ', 
        (SELECT COUNT(*) FROM inspector WHERE is_encrypted = 1), 
        ' inspectors and ',
        (SELECT COUNT(*) FROM collector WHERE is_encrypted = 1),
        ' collectors with encryption flag'
    ) as status;
