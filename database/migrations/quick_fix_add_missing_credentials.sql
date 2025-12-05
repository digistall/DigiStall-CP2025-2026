-- ============================================================
-- QUICK FIX: Add Missing Credentials for Stallholders
-- ============================================================
-- Run this in phpMyAdmin
-- 
-- This adds login credentials for stallholders who don't have them:
-- - applicant_id 35 (Carlos Mendoza)
-- - applicant_id 36 (Ana Villanueva)  
-- - applicant_id 37 (Fernando Garcia)
--
-- Default Password: Test@123
-- ============================================================

USE `naga_stall`;

-- Add credential for Carlos Mendoza (applicant_id 35)
INSERT INTO `credential` (`applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`)
VALUES (35, '25-35001', '$2b$10$lYLaIa3klQd0ifKyV8mUa.D1RSTqj/BMfpvFs69pGixHTwozNjg1.', NOW(), 1);

-- Add credential for Ana Villanueva (applicant_id 36)
INSERT INTO `credential` (`applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`)
VALUES (36, '25-36001', '$2b$10$lYLaIa3klQd0ifKyV8mUa.D1RSTqj/BMfpvFs69pGixHTwozNjg1.', NOW(), 1);

-- Add credential for Fernando Garcia (applicant_id 37)
INSERT INTO `credential` (`applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`)
VALUES (37, '25-37001', '$2b$10$lYLaIa3klQd0ifKyV8mUa.D1RSTqj/BMfpvFs69pGixHTwozNjg1.', NOW(), 1);

-- ============================================================
-- VERIFICATION: Show all users who can login and own stalls
-- ============================================================
SELECT 
    c.user_name as 'Username',
    'Test@123' as 'Password',
    a.applicant_full_name as 'Name',
    sh.business_name as 'Business',
    st.stall_no as 'Stall',
    b.branch_name as 'Branch'
FROM credential c
INNER JOIN applicant a ON c.applicant_id = a.applicant_id
INNER JOIN stallholder sh ON c.applicant_id = sh.applicant_id
INNER JOIN stall st ON sh.stall_id = st.stall_id
INNER JOIN branch b ON sh.branch_id = b.branch_id
WHERE c.is_active = 1 AND sh.contract_status = 'Active';

-- ============================================================
-- LOGIN CREDENTIALS SUMMARY:
-- ============================================================
-- | Username  | Password | Name             | Stall |
-- |-----------|----------|------------------|-------|
-- | 25-59663  | Jeno123! | Jeno (existing)  | 54    |
-- | 25-13962  | (yours)  | Roberto Cruz     | 57    |
-- | 25-24154  | (yours)  | Elena Reyes      | 58    |
-- | 25-35001  | Test@123 | Carlos Mendoza   | 55    |
-- | 25-36001  | Test@123 | Ana Villanueva   | 91    |
-- | 25-37001  | Test@123 | Fernando Garcia  | 93    |
-- ============================================================
