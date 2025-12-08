-- =========================================
-- Sample Stallholder Account for Testing
-- =========================================
-- Login Credentials:
--   Username: 25-00500
--   Password: Test@123
-- =========================================

-- Use the naga_stall database
USE `naga_stall`;

-- Start transaction for data integrity
START TRANSACTION;

-- =========================================
-- 1. Create Applicant Record
-- =========================================
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
    500,
    'Juan Dela Cruz',
    '09171234568',
    'Barangay San Felipe, Naga City, Camarines Sur',
    '1990-05-15',
    'Single',
    'College Graduate',
    NOW(),
    NOW(),
    '25-00500',
    'juan.delacruz@email.com',
    NULL,
    0,
    NULL,
    0,
    NULL
);

-- =========================================
-- 2. Create Credential Record (for login)
-- =========================================
-- Password: Test@123 (bcrypt hashed)
INSERT INTO `credential` (
    `applicant_id`,
    `user_name`,
    `password_hash`,
    `created_date`,
    `last_login`,
    `is_active`
) VALUES (
    500,
    '25-00500',
    '$2b$10$wfH1aMb4epXqHg.vgPUm/OLtYkzamjjNNWdrcyHknewTvC4mPF/Tm',
    NOW(),
    NULL,
    1
);

-- =========================================
-- 3. Create Application Record (Approved)
-- =========================================
INSERT INTO `application` (
    `stall_id`,
    `applicant_id`,
    `application_date`,
    `application_status`,
    `created_at`,
    `updated_at`
) VALUES (
    50,  -- Stall NPM-001 (Main Entrance Area)
    500,
    CURDATE(),
    'Approved',
    NOW(),
    NOW()
);

-- =========================================
-- 4. Create Stallholder Record
-- =========================================
INSERT INTO `stallholder` (
    `stallholder_id`,
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
    500,
    500,
    'Juan Dela Cruz',
    '09171234568',
    'juan.delacruz@email.com',
    'Barangay San Felipe, Naga City, Camarines Sur',
    'Juan''s Electronics Hub',
    'Electronics',
    1,   -- Naga Public Market (branch_id 1)
    50,  -- Stall NPM-001
    '2025-01-01',
    '2025-12-31',
    'Active',
    30240.00,  -- Annual lease (12 months * 2520)
    2520.00,   -- Monthly rent from stall table
    'paid',
    '2025-12-01',
    'Sample stallholder account for testing purposes',
    1,
    'Compliant',
    NOW(),
    NOW(),
    NULL
);

-- =========================================
-- 5. Create Stallholder Documents
-- =========================================
-- Document types for branch 1: Business Permit(1), Sanitary Permit(2), 
-- Fire Safety(3), Cedula(5), Valid ID(6), Barangay Clearance(7), TIN(11)

-- Business Permit
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
) VALUES (
    500, 1,
    '/uploads/documents/juan_delacruz_business_permit.pdf',
    'business_permit_2025.pdf',
    2048576,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    '2025-12-31',
    'Valid business permit for electronics retail'
);

-- Sanitary Permit
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
) VALUES (
    500, 2,
    '/uploads/documents/juan_delacruz_sanitary_permit.pdf',
    'sanitary_permit_2025.pdf',
    1536890,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    '2025-12-31',
    'Sanitary permit for retail establishment'
);

-- Fire Safety Certificate
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
) VALUES (
    500, 3,
    '/uploads/documents/juan_delacruz_fire_safety.pdf',
    'fire_safety_cert_2025.pdf',
    1847293,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    '2025-12-31',
    'Fire safety inspection passed'
);

-- Cedula
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
) VALUES (
    500, 5,
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
);

-- Valid ID
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
) VALUES (
    500, 6,
    '/uploads/documents/juan_delacruz_valid_id.pdf',
    'national_id.pdf',
    1672834,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    '2030-12-31',
    'Philippine National ID'
);

-- Barangay Clearance
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
) VALUES (
    500, 7,
    '/uploads/documents/juan_delacruz_brgy_clearance.pdf',
    'barangay_clearance_2025.pdf',
    1234567,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    '2025-12-31',
    'Certificate of good moral character'
);

-- TIN Certificate
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
) VALUES (
    500, 11,
    '/uploads/documents/juan_delacruz_tin.pdf',
    'tin_certificate.pdf',
    987654,
    NOW(),
    'verified',
    NULL,
    NOW(),
    NULL,
    NULL,
    'Tax Identification Number certificate'
);

-- Commit transaction
COMMIT;

-- =========================================
-- Verification Queries
-- =========================================
SELECT 'Sample Stallholder Account Created Successfully!' AS Status;

SELECT 'Login Credentials:' AS Info;
SELECT '  Username: 25-00500' AS Username;
SELECT '  Password: Test@123' AS Password;

-- Verify the data was inserted
SELECT 
    a.applicant_id,
    a.applicant_full_name,
    c.user_name,
    s.stallholder_name,
    s.business_name,
    s.contract_status,
    s.payment_status
FROM applicant a
JOIN credential c ON a.applicant_id = c.applicant_id
JOIN stallholder s ON a.applicant_id = s.applicant_id
WHERE a.applicant_id = 500;

-- Check documents uploaded
SELECT 
    sd.document_id,
    dt.document_name,
    sd.verification_status,
    sd.expiry_date
FROM stallholder_documents sd
JOIN document_types dt ON sd.document_type_id = dt.document_type_id
WHERE sd.stallholder_id = 500;
