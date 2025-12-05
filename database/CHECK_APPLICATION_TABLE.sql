-- ========================================
-- CHECK APPLICATION TABLE FOR APPLICANT 12
-- This is what the backend checks for "Already Applied"
-- ========================================

USE `naga_stall`;

-- Check the application table (this is what causes "Already Applied")
SELECT 
    application_id,
    applicant_id,
    stall_id,
    application_status,
    application_date,
    created_at,
    updated_at
FROM application 
WHERE applicant_id = 12
ORDER BY application_date DESC;

-- Count applications by status for applicant 12
SELECT 
    application_status,
    COUNT(*) as count
FROM application
WHERE applicant_id = 12
GROUP BY application_status;
