-- ============================================================
-- Sample Stallholder Account for Testing
-- Generated based on updated naga_stall.sql schema
-- ============================================================
-- This script creates a complete stallholder account that can 
-- log in via the mobile app.
-- 
-- LOGIN CREDENTIALS:
--   Username: 25-12345
--   Password: Test@123
-- ============================================================

-- Step 1: Insert applicant record
INSERT INTO `applicant` (
    `applicant_id`, 
    `applicant_full_name`, 
    `applicant_contact_number`, 
    `applicant_address`, 
    `applicant_birthdate`, 
    `applicant_civil_status`, 
    `applicant_educational_attainment`, 
    `created_at`, 
    `updated_at`, 
    `applicant_username`, 
    `applicant_email`, 
    `applicant_password_hash`, 
    `email_verified`, 
    `last_login`, 
    `login_attempts`, 
    `account_locked_until`
) VALUES (
    200,                                    -- applicant_id (use a high number to avoid conflicts)
    'Juan Dela Cruz',                       -- applicant_full_name
    '09123456789',                          -- applicant_contact_number
    'Barangay San Felipe, Naga City',       -- applicant_address
    '1990-05-15',                           -- applicant_birthdate
    'Single',                               -- applicant_civil_status
    'College Graduate',                     -- applicant_educational_attainment
    NOW(),                                  -- created_at
    NOW(),                                  -- updated_at
    NULL,                                   -- applicant_username
    'juan.delacruz@email.com',              -- applicant_email
    NULL,                                   -- applicant_password_hash
    0,                                      -- email_verified
    NULL,                                   -- last_login
    0,                                      -- login_attempts
    NULL                                    -- account_locked_until
);

-- Step 2: Insert credential record (for login)
-- Password: Test@123 (bcrypt hashed)
INSERT INTO `credential` (
    `applicant_id`, 
    `user_name`, 
    `password_hash`, 
    `created_date`, 
    `last_login`, 
    `is_active`
) VALUES (
    200,                                                                      -- applicant_id (same as above)
    '25-12345',                                                               -- user_name (login username)
    '$2b$10$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X.VQ9k2r.ks2LsJnS',          -- password_hash (bcrypt hash of 'Test@123')
    NOW(),                                                                    -- created_date
    NULL,                                                                     -- last_login
    1                                                                         -- is_active
);

-- Step 3: Insert application record (Approved)
-- Using stall_id = 55 which exists in the stall table (Food Court Central, branch 1)
INSERT INTO `application` (
    `stall_id`, 
    `applicant_id`, 
    `application_date`, 
    `application_status`, 
    `created_at`, 
    `updated_at`
) VALUES (
    55,                 -- stall_id (NPM-006, Food Court Central - exists in stall table)
    200,                -- applicant_id (same as above)
    CURDATE(),          -- application_date
    'Approved',         -- application_status
    NOW(),              -- created_at
    NOW()               -- updated_at
);

-- Step 4: Insert stallholder record
INSERT INTO `stallholder` (
    `applicant_id`, 
    `stallholder_name`, 
    `contact_number`, 
    `email`, 
    `address`, 
    `business_name`, 
    `business_type`, 
    `branch_id`, 
    `stall_id`, 
    `contract_start_date`, 
    `contract_end_date`, 
    `contract_status`, 
    `lease_amount`, 
    `monthly_rent`, 
    `payment_status`, 
    `last_payment_date`, 
    `notes`, 
    `created_by_business_manager`, 
    `compliance_status`, 
    `date_created`, 
    `updated_at`, 
    `last_violation_date`
) VALUES (
    200,                                    -- applicant_id (same as above)
    'Juan Dela Cruz',                       -- stallholder_name
    '09123456789',                          -- contact_number
    'juan.delacruz@email.com',              -- email
    'Barangay San Felipe, Naga City',       -- address
    'JDC Sari-Sari Store',                  -- business_name
    'General Merchandise',                  -- business_type
    1,                                      -- branch_id (must match stall's branch)
    55,                                     -- stall_id (same as application)
    '2025-01-01',                           -- contract_start_date
    '2025-12-31',                           -- contract_end_date
    'Active',                               -- contract_status
    28800.00,                               -- lease_amount (annual)
    2400.00,                                -- monthly_rent
    'paid',                                 -- payment_status
    CURDATE(),                              -- last_payment_date
    'Test stallholder account for mobile app testing',  -- notes
    1,                                      -- created_by_business_manager
    'Compliant',                            -- compliance_status
    NOW(),                                  -- date_created
    NOW(),                                  -- updated_at
    NULL                                    -- last_violation_date
);

-- Step 5: (Optional) Insert some stallholder documents 
-- These are documents the stallholder has already submitted
INSERT INTO `stallholder_documents` (
    `stallholder_id`, 
    `document_type_id`, 
    `file_path`, 
    `original_filename`, 
    `file_size`, 
    `upload_date`, 
    `verification_status`, 
    `verified_by`, 
    `verified_at`, 
    `rejection_reason`, 
    `expiry_date`, 
    `notes`
) VALUES 
-- Business Permit (document_type_id = 1)
(
    (SELECT stallholder_id FROM stallholder WHERE applicant_id = 200),
    1,
    '/uploads/documents/juan_delacruz_business_permit.pdf',
    'business_permit_2025.pdf',
    2048576,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    '2025-12-31',
    'Valid business permit'
),
-- Cedula (document_type_id = 4)
(
    (SELECT stallholder_id FROM stallholder WHERE applicant_id = 200),
    4,
    '/uploads/documents/juan_delacruz_cedula.pdf',
    'cedula_2025.pdf',
    1024768,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    '2025-12-31',
    'Community tax certificate'
),
-- Valid ID (document_type_id = 5)
(
    (SELECT stallholder_id FROM stallholder WHERE applicant_id = 200),
    5,
    '/uploads/documents/juan_delacruz_valid_id.pdf',
    'national_id.pdf',
    1536890,
    NOW(),
    'pending',
    NULL,
    NULL,
    NULL,
    '2030-12-31',
    'National ID - awaiting verification'
);

-- ============================================================
-- VERIFICATION QUERY
-- Run this to verify the account was created successfully:
-- ============================================================
-- SELECT 
--     a.applicant_id,
--     a.applicant_full_name,
--     c.user_name AS login_username,
--     s.stallholder_id,
--     s.business_name,
--     s.compliance_status
-- FROM applicant a
-- JOIN credential c ON a.applicant_id = c.applicant_id
-- JOIN stallholder s ON a.applicant_id = s.applicant_id
-- WHERE a.applicant_id = 200;
-- ============================================================

-- Verify the account was created
SELECT 
    'Account Created Successfully!' as status,
    a.applicant_id,
    a.applicant_full_name,
    c.user_name as login_username,
    'Test@123' as login_password,
    sh.stallholder_id,
    sh.business_name,
    sh.branch_id,
    b.branch_name
FROM applicant a
JOIN credential c ON a.applicant_id = c.applicant_id
JOIN stallholder sh ON a.applicant_id = sh.applicant_id
JOIN branch b ON sh.branch_id = b.branch_id
WHERE a.applicant_id = 200;
