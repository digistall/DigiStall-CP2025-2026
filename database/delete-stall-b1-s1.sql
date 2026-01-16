-- Delete stall B1-S1 and its images
-- First delete images (foreign key constraint)
DELETE FROM stall_images WHERE stall_id = (SELECT stall_id FROM stall WHERE stall_number = 'B1-S1');

-- Then delete the stall
DELETE FROM stall WHERE stall_number = 'B1-S1';

-- Verify deletion
SELECT 
    COUNT(*) as remaining_stalls,
    (SELECT COUNT(*) FROM stall WHERE stall_number = 'B1-S1') as b1_s1_exists
FROM stall;
