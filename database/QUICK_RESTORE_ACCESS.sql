-- ========================================
-- QUICK RESTORE - Automatically create application to unlock Naga City
-- Run this entire script to restore access
-- ========================================

USE `naga_stall`;

-- Insert a sample application for a Fixed Price stall in Naga City
-- This will unlock the Naga City area so you can see all stalls there
INSERT INTO application (applicant_id, stall_id, application_date, application_status)
SELECT 
    12 as applicant_id,
    s.stall_id,
    NOW() as application_date,
    'Pending' as application_status
FROM stall s
JOIN section sec ON s.section_id = sec.section_id
JOIN floor f ON sec.floor_id = f.floor_id
JOIN branch b ON f.branch_id = b.branch_id
WHERE s.is_available = 1 
  AND s.status = 'Active'
  AND b.area = 'Naga City'
  AND s.price_type = 'Fixed Price'
  AND NOT EXISTS (
    SELECT 1 FROM application 
    WHERE applicant_id = 12 AND stall_id = s.stall_id
  )
LIMIT 1;

-- Show the created application
SELECT 
    app.application_id,
    app.applicant_id,
    app.stall_id,
    s.stall_no,
    s.price_type,
    b.area,
    b.branch_name,
    app.application_status,
    app.application_date
FROM application app
JOIN stall s ON app.stall_id = s.stall_id
JOIN section sec ON s.section_id = sec.section_id
JOIN floor f ON sec.floor_id = f.floor_id
JOIN branch b ON f.branch_id = b.branch_id
WHERE app.applicant_id = 12;

SELECT '✅ Access restored! Reload your mobile app to see stalls in Naga City area.' as 'Status';
