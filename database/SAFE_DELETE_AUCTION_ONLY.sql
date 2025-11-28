-- ========================================
-- SAFE DELETE - Only delete auction pre-registrations
-- Keeps your area applications intact
-- ========================================

USE `naga_stall`;

-- First, let's see what applications exist
SELECT 
    app.application_id,
    app.stall_id,
    s.stall_no,
    s.price_type,
    app.application_status,
    app.application_date
FROM application app
LEFT JOIN stall s ON app.stall_id = s.stall_id
WHERE app.applicant_id = 12
ORDER BY app.application_date DESC;

-- Delete ONLY auction stall applications (keeps Fixed Price and Raffle)
-- Uncomment below to delete only auction applications:
-- DELETE app FROM application app
-- JOIN stall s ON app.stall_id = s.stall_id
-- WHERE app.applicant_id = 12 AND s.price_type = 'Auction';

-- Delete auction participants
-- DELETE FROM auction_participants WHERE applicant_id = 12;

-- Check remaining applications (should still have Fixed Price/Raffle)
-- SELECT * FROM application WHERE applicant_id = 12;
