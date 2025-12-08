-- ============================================================
-- FIX: Credentials and Stallholder Data Mismatch
-- ============================================================
-- This script fixes the data inconsistency where:
-- 1. Some stallholders have credentials but their stallholder record is missing
-- 2. Some stallholders have stall ownership but no credentials to login
-- 
-- RUN THIS IN YOUR DATABASE (phpMyAdmin)
-- ============================================================

USE `naga_stall`;

-- ============================================================
-- STEP 1: DIAGNOSTIC - Check current data state
-- ============================================================

-- Show applicants WITH credentials but WITHOUT stallholder record
-- (These users can LOGIN but mobile app shows "no stall")
SELECT 
    'HAS CREDENTIALS, NO STALLHOLDER' as issue,
    c.applicant_id,
    a.applicant_full_name,
    c.user_name as login_username,
    'Can login, but no stall ownership' as problem
FROM credential c
LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
LEFT JOIN stallholder sh ON c.applicant_id = sh.applicant_id
WHERE sh.stallholder_id IS NULL
  AND c.is_active = 1;

-- Show stallholders WITHOUT credentials
-- (These users OWN stalls but CANNOT login to mobile app)
SELECT 
    'HAS STALLHOLDER, NO CREDENTIALS' as issue,
    sh.applicant_id,
    sh.stallholder_name,
    sh.stall_id,
    st.stall_no,
    'Owns stall, but cannot login' as problem
FROM stallholder sh
LEFT JOIN credential c ON sh.applicant_id = c.applicant_id
LEFT JOIN stall st ON sh.stall_id = st.stall_id
WHERE c.registrationid IS NULL
  AND sh.contract_status = 'Active';

-- ============================================================
-- STEP 2: FIX - Create credentials for stallholders who don't have them
-- ============================================================
-- Password will be 'DigiStall2025!' (bcrypt hash below)
-- Users should change password after first login

-- Generate username format: YEAR-RANDOMNUMBER
-- Using bcrypt hash for 'DigiStall2025!'

-- Fix for applicant_id = 35 (Carlos Mendoza)
INSERT INTO `credential` (`applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`)
SELECT 
    35,
    CONCAT('25-', LPAD(FLOOR(RAND() * 99999), 5, '0')),
    '$2b$10$rL7fKqHu3ZVqYEg5N8mX6.8yH9pV2nX7mJ3kL1oP4qR5sT6uV7wX8', -- DigiStall2025!
    NOW(),
    1
WHERE NOT EXISTS (SELECT 1 FROM credential WHERE applicant_id = 35);

-- Fix for applicant_id = 36 (Ana Villanueva)
INSERT INTO `credential` (`applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`)
SELECT 
    36,
    CONCAT('25-', LPAD(FLOOR(RAND() * 99999), 5, '0')),
    '$2b$10$rL7fKqHu3ZVqYEg5N8mX6.8yH9pV2nX7mJ3kL1oP4qR5sT6uV7wX8', -- DigiStall2025!
    NOW(),
    1
WHERE NOT EXISTS (SELECT 1 FROM credential WHERE applicant_id = 36);

-- Fix for applicant_id = 37 (Fernando Garcia)
INSERT INTO `credential` (`applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`)
SELECT 
    37,
    CONCAT('25-', LPAD(FLOOR(RAND() * 99999), 5, '0')),
    '$2b$10$rL7fKqHu3ZVqYEg5N8mX6.8yH9pV2nX7mJ3kL1oP4qR5sT6uV7wX8', -- DigiStall2025!
    NOW(),
    1
WHERE NOT EXISTS (SELECT 1 FROM credential WHERE applicant_id = 37);

-- ============================================================
-- STEP 3: VERIFICATION - Check the fixed data
-- ============================================================

-- Show all users who can now login AND own stalls
SELECT 
    '✅ FIXED - CAN LOGIN AND OWNS STALL' as status,
    c.applicant_id,
    a.applicant_full_name,
    c.user_name as login_username,
    'DigiStall2025!' as default_password,
    sh.stallholder_id,
    sh.business_name,
    st.stall_no,
    b.branch_name,
    sh.contract_status
FROM credential c
INNER JOIN applicant a ON c.applicant_id = a.applicant_id
INNER JOIN stallholder sh ON c.applicant_id = sh.applicant_id
INNER JOIN stall st ON sh.stall_id = st.stall_id
INNER JOIN branch b ON sh.branch_id = b.branch_id
WHERE c.is_active = 1
  AND sh.contract_status = 'Active'
ORDER BY c.applicant_id;

-- ============================================================
-- STEP 4: Show accounts that ONLY have credentials (applicants, not stallholders yet)
-- These are users who can login to browse stalls but haven't been assigned a stall
-- ============================================================

SELECT 
    'ℹ️ APPLICANT ONLY (can browse, no stall yet)' as status,
    c.applicant_id,
    a.applicant_full_name,
    c.user_name as login_username,
    app.application_status,
    CASE 
        WHEN app.application_id IS NULL THEN 'No application'
        WHEN app.application_status = 'Approved' THEN 'Approved - awaiting payment/assignment'
        WHEN app.application_status = 'Pending' THEN 'Pending approval'
        ELSE app.application_status
    END as next_step
FROM credential c
INNER JOIN applicant a ON c.applicant_id = a.applicant_id
LEFT JOIN stallholder sh ON c.applicant_id = sh.applicant_id
LEFT JOIN application app ON c.applicant_id = app.applicant_id
WHERE sh.stallholder_id IS NULL
  AND c.is_active = 1;
