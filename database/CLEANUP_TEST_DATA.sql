-- ========================================
-- CLEAN UP TEST DATA FOR APPLICANT 12
-- Use this to reset and test pre-registration again
-- ========================================

USE `naga_stall`;

-- Show what will be deleted (run this first to see)
SELECT 'Applications to be deleted:' as info;
SELECT * FROM application WHERE applicant_id = 12;

SELECT 'Auction participants to be deleted:' as info;
SELECT * FROM auction_participants WHERE applicant_id = 12;

-- Uncomment the lines below to actually delete the data
-- DELETE FROM auction_participants WHERE applicant_id = 12;
-- DELETE FROM application WHERE applicant_id = 12;

-- SELECT '✅ Test data cleaned! You can now test pre-registration again.' as 'Status';
