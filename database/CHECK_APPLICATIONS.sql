-- ========================================
-- CHECK FOR APPLICATIONS DATA
-- Run this to see if applications were created
-- ========================================

USE `naga_stall`;

-- Check applications for applicant_id 12
SELECT * FROM application 
WHERE applicant_id = 12
ORDER BY application_date DESC;

-- Check auction_participants for applicant_id 12
SELECT * FROM auction_participants
WHERE applicant_id = 12
ORDER BY created_at DESC;

-- Check if there are any applications for stall_id 116
SELECT 
    app.application_id,
    app.applicant_id,
    app.stall_id,
    app.application_status,
    app.application_date,
    s.stall_no,
    s.price_type,
    CONCAT(a.first_name, ' ', a.last_name) as applicant_name
FROM application app
LEFT JOIN stall s ON app.stall_id = s.stall_id
LEFT JOIN applicant a ON app.applicant_id = a.applicant_id
WHERE app.stall_id = 116 OR app.applicant_id = 12
ORDER BY app.application_date DESC;
