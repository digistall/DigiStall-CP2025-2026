-- Migration: Allow NULL stall_id for general applications
-- This allows applications to be submitted without a specific stall assigned
-- The stall can be assigned later by an administrator

USE naga_stall;

-- Modify the application table to allow NULL stall_id
ALTER TABLE application 
MODIFY COLUMN stall_id INT NULL;

-- Add a comment to document this change
ALTER TABLE application 
MODIFY COLUMN stall_id INT NULL 
COMMENT 'Stall ID - Can be NULL for general applications where stall will be assigned later by admin';

-- Optional: Add an index to help query general applications
CREATE INDEX idx_general_applications ON application(stall_id, application_status) 
COMMENT 'Index to efficiently query general applications (stall_id IS NULL)';

-- Show the updated structure
DESCRIBE application;

SELECT 'Migration completed: stall_id now allows NULL values for general applications' AS status;
