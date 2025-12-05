-- ============================================================
-- CLEAN DATABASE & CREATE 3 PERFECTLY CONNECTED ACCOUNTS
-- ============================================================
-- This script will:
-- 1. Remove all existing sample data
-- 2. Create 3 complete stallholder accounts with perfect connections
-- 
-- RUN THIS IN phpMyAdmin
-- ============================================================

USE `naga_stall`;

-- ============================================================
-- STEP 1: REMOVE ALL EXISTING SAMPLE DATA
-- ============================================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Clear payment records
DELETE FROM payments WHERE stallholder_id > 0;

-- Clear stallholder documents
DELETE FROM stallholder_documents WHERE stallholder_id > 0;

-- Clear stallholder document submissions  
DELETE FROM stallholder_document_submissions WHERE stallholder_id > 0;

-- Clear violation reports
DELETE FROM violation_report WHERE stallholder_id > 0;

-- Clear complaints
DELETE FROM complaint WHERE stallholder_id > 0;

-- Clear stallholders
DELETE FROM stallholder WHERE stallholder_id > 0;

-- Clear raffle participants
DELETE FROM raffle_participants WHERE applicant_id > 0;

-- Clear auction bids
DELETE FROM auction_bids WHERE applicant_id > 0;

-- Clear applications
DELETE FROM application WHERE application_id > 0;

-- Clear credentials
DELETE FROM credential WHERE registrationid > 0;

-- Clear other_information
DELETE FROM other_information WHERE applicant_id > 0;

-- Clear business_information
DELETE FROM business_information WHERE applicant_id > 0;

-- Clear spouse
DELETE FROM spouse WHERE applicant_id > 0;

-- Clear applicants
DELETE FROM applicant WHERE applicant_id > 0;

-- Reset auto-increment counters
ALTER TABLE applicant AUTO_INCREMENT = 1;
ALTER TABLE credential AUTO_INCREMENT = 1;
ALTER TABLE application AUTO_INCREMENT = 1;
ALTER TABLE stallholder AUTO_INCREMENT = 1;
ALTER TABLE payments AUTO_INCREMENT = 1;
ALTER TABLE stallholder_documents AUTO_INCREMENT = 1;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- STEP 2: CREATE 3 PERFECTLY CONNECTED STALLHOLDER ACCOUNTS
-- ============================================================

-- ============================================================
-- ACCOUNT 1: Maria Santos - Food Stall Owner
-- Username: maria2025 | Password: Test@123
-- Branch: Naga Public Market (branch_id: 1) | Stall: 54
-- ============================================================

-- 1.1 Create Applicant
INSERT INTO `applicant` (
    `applicant_id`, `applicant_full_name`, `applicant_contact_number`, 
    `applicant_address`, `applicant_birthdate`, `applicant_civil_status`, 
    `applicant_educational_attainment`, `applicant_email`
) VALUES (
    1, 'Maria Santos', '09171234567',
    'Barangay Carolina, Naga City', '1985-03-15', 'Married',
    'College Graduate', 'maria.santos@email.com'
);

-- 1.2 Create Business Information
INSERT INTO `business_information` (
    `applicant_id`, `nature_of_business`, `capitalization`,
    `source_of_capital`, `previous_business_experience`, `relative_stall_owner`
) VALUES (
    1, 'Food Service - Filipino Cuisine', 150000.00,
    'Personal Savings', '5 years in food industry', 'No'
);

-- 1.3 Create Other Information
INSERT INTO `other_information` (
    `applicant_id`, `email_address`, `signature_of_applicant`, 
    `house_sketch_location`, `valid_id`
) VALUES (
    1, 'maria.santos@email.com', '/uploads/signatures/maria_sig.png',
    '/uploads/sketches/maria_house.png', '/uploads/ids/maria_id.jpg'
);

-- 1.4 Create Credential (for mobile app login)
-- Password: Test@123 (bcrypt hashed)
INSERT INTO `credential` (
    `applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`
) VALUES (
    1, 'maria2025', '$2b$10$lYLaIa3klQd0ifKyV8mUa.D1RSTqj/BMfpvFs69pGixHTwozNjg1.', NOW(), 1
);

-- 1.5 Create Application (Approved)
INSERT INTO `application` (
    `stall_id`, `applicant_id`, `application_date`, `application_status`
) VALUES (
    54, 1, '2025-01-10', 'Approved'
);

-- 1.6 Create Stallholder (THIS LINKS APPLICANT TO STALL!)
INSERT INTO `stallholder` (
    `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`,
    `business_name`, `business_type`, `branch_id`, `stall_id`,
    `contract_start_date`, `contract_end_date`, `contract_status`,
    `lease_amount`, `monthly_rent`, `payment_status`,
    `created_by_business_manager`, `compliance_status`
) VALUES (
    1, 'Maria Santos', '09171234567', 'maria.santos@email.com', 
    'Barangay Carolina, Naga City',
    'Maria\'s Carinderia', 'Food Service', 1, 54,
    '2025-01-15', '2026-01-14', 'Active',
    28800.00, 2400.00, 'paid',
    1, 'Compliant'
);

-- 1.7 Update stall to Occupied
UPDATE `stall` SET `status` = 'Occupied', `is_available` = 0 WHERE `stall_id` = 54;

-- 1.8 Create Payment Record
INSERT INTO `payments` (
    `stallholder_id`, `amount`, `payment_date`, `payment_time`,
    `payment_for_month`, `payment_type`, `payment_method`, 
    `payment_status`, `branch_id`, `collected_by`
) VALUES (
    1, 2400.00, '2025-12-01', '10:30:00',
    '2025-12', 'Monthly Rent', 'onsite',
    'completed', 1, 'Admin'
);

-- 1.9 Create Stallholder Documents
INSERT INTO `stallholder_documents` (
    `stallholder_id`, `document_type_id`, `file_path`, `original_filename`,
    `verification_status`, `expiry_date`, `notes`
) VALUES 
(1, 1, '/uploads/docs/maria_business_permit.pdf', 'business_permit.pdf', 'verified', '2025-12-31', 'Business Permit'),
(1, 5, '/uploads/docs/maria_valid_id.pdf', 'valid_id.pdf', 'verified', '2030-12-31', 'Government ID');


-- ============================================================
-- ACCOUNT 2: Juan Dela Cruz - Electronics Repair
-- Username: juan2025 | Password: Test@123
-- Branch: Naga Public Market (branch_id: 1) | Stall: 55
-- ============================================================

-- 2.1 Create Applicant
INSERT INTO `applicant` (
    `applicant_id`, `applicant_full_name`, `applicant_contact_number`, 
    `applicant_address`, `applicant_birthdate`, `applicant_civil_status`, 
    `applicant_educational_attainment`, `applicant_email`
) VALUES (
    2, 'Juan Dela Cruz', '09181234567',
    'Barangay Triangulo, Naga City', '1990-07-20', 'Single',
    'Vocational Graduate', 'juan.delacruz@email.com'
);

-- 2.2 Create Business Information
INSERT INTO `business_information` (
    `applicant_id`, `nature_of_business`, `capitalization`,
    `source_of_capital`, `previous_business_experience`, `relative_stall_owner`
) VALUES (
    2, 'Electronics Repair Services', 80000.00,
    'Bank Loan', '3 years technician experience', 'No'
);

-- 2.3 Create Other Information
INSERT INTO `other_information` (
    `applicant_id`, `email_address`, `signature_of_applicant`, 
    `house_sketch_location`, `valid_id`
) VALUES (
    2, 'juan.delacruz@email.com', '/uploads/signatures/juan_sig.png',
    '/uploads/sketches/juan_house.png', '/uploads/ids/juan_id.jpg'
);

-- 2.4 Create Credential
INSERT INTO `credential` (
    `applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`
) VALUES (
    2, 'juan2025', '$2b$10$lYLaIa3klQd0ifKyV8mUa.D1RSTqj/BMfpvFs69pGixHTwozNjg1.', NOW(), 1
);

-- 2.5 Create Application (Approved)
INSERT INTO `application` (
    `stall_id`, `applicant_id`, `application_date`, `application_status`
) VALUES (
    55, 2, '2025-02-01', 'Approved'
);

-- 2.6 Create Stallholder
INSERT INTO `stallholder` (
    `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`,
    `business_name`, `business_type`, `branch_id`, `stall_id`,
    `contract_start_date`, `contract_end_date`, `contract_status`,
    `lease_amount`, `monthly_rent`, `payment_status`,
    `created_by_business_manager`, `compliance_status`
) VALUES (
    2, 'Juan Dela Cruz', '09181234567', 'juan.delacruz@email.com', 
    'Barangay Triangulo, Naga City',
    'JDC Electronics Repair', 'Electronics', 1, 55,
    '2025-02-15', '2026-02-14', 'Active',
    31200.00, 2600.00, 'paid',
    1, 'Compliant'
);

-- 2.7 Update stall to Occupied
UPDATE `stall` SET `status` = 'Occupied', `is_available` = 0 WHERE `stall_id` = 55;

-- 2.8 Create Payment Record
INSERT INTO `payments` (
    `stallholder_id`, `amount`, `payment_date`, `payment_time`,
    `payment_for_month`, `payment_type`, `payment_method`, 
    `payment_status`, `branch_id`, `collected_by`
) VALUES (
    2, 2600.00, '2025-12-01', '11:00:00',
    '2025-12', 'Monthly Rent', 'onsite',
    'completed', 1, 'Admin'
);

-- 2.9 Create Stallholder Documents
INSERT INTO `stallholder_documents` (
    `stallholder_id`, `document_type_id`, `file_path`, `original_filename`,
    `verification_status`, `expiry_date`, `notes`
) VALUES 
(2, 1, '/uploads/docs/juan_business_permit.pdf', 'business_permit.pdf', 'verified', '2025-12-31', 'Business Permit'),
(2, 5, '/uploads/docs/juan_valid_id.pdf', 'valid_id.pdf', 'verified', '2028-06-15', 'Government ID');


-- ============================================================
-- ACCOUNT 3: Ana Reyes - Clothing/Fashion Store
-- Username: ana2025 | Password: Test@123  
-- Branch: Naga City Mall (branch_id: 3) | Stall: 91
-- ============================================================

-- 3.1 Create Applicant
INSERT INTO `applicant` (
    `applicant_id`, `applicant_full_name`, `applicant_contact_number`, 
    `applicant_address`, `applicant_birthdate`, `applicant_civil_status`, 
    `applicant_educational_attainment`, `applicant_email`
) VALUES (
    3, 'Ana Reyes', '09191234567',
    'Barangay San Francisco, Naga City', '1988-11-05', 'Married',
    'College Graduate', 'ana.reyes@email.com'
);

-- 3.2 Create Spouse Information
INSERT INTO `spouse` (
    `applicant_id`, `spouse_full_name`, `spouse_birthdate`,
    `spouse_educational_attainment`, `spouse_contact_number`, `spouse_occupation`
) VALUES (
    3, 'Pedro Reyes', '1986-05-10',
    'College Graduate', '09191234568', 'Engineer'
);

-- 3.3 Create Business Information
INSERT INTO `business_information` (
    `applicant_id`, `nature_of_business`, `capitalization`,
    `source_of_capital`, `previous_business_experience`, `relative_stall_owner`
) VALUES (
    3, 'Retail - Clothing and Fashion', 200000.00,
    'Joint Savings with Spouse', '4 years online selling', 'No'
);

-- 3.4 Create Other Information
INSERT INTO `other_information` (
    `applicant_id`, `email_address`, `signature_of_applicant`, 
    `house_sketch_location`, `valid_id`
) VALUES (
    3, 'ana.reyes@email.com', '/uploads/signatures/ana_sig.png',
    '/uploads/sketches/ana_house.png', '/uploads/ids/ana_id.jpg'
);

-- 3.5 Create Credential
INSERT INTO `credential` (
    `applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`
) VALUES (
    3, 'ana2025', '$2b$10$lYLaIa3klQd0ifKyV8mUa.D1RSTqj/BMfpvFs69pGixHTwozNjg1.', NOW(), 1
);

-- 3.6 Create Application (Approved)
INSERT INTO `application` (
    `stall_id`, `applicant_id`, `application_date`, `application_status`
) VALUES (
    91, 3, '2025-01-20', 'Approved'
);

-- 3.7 Create Stallholder
INSERT INTO `stallholder` (
    `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`,
    `business_name`, `business_type`, `branch_id`, `stall_id`,
    `contract_start_date`, `contract_end_date`, `contract_status`,
    `lease_amount`, `monthly_rent`, `payment_status`,
    `created_by_business_manager`, `compliance_status`
) VALUES (
    3, 'Ana Reyes', '09191234567', 'ana.reyes@email.com', 
    'Barangay San Francisco, Naga City',
    'Ana\'s Fashion Corner', 'Clothing', 3, 91,
    '2025-02-01', '2026-01-31', 'Active',
    30000.00, 2500.00, 'current',
    1, 'Compliant'
);

-- 3.8 Update stall to Occupied
UPDATE `stall` SET `status` = 'Occupied', `is_available` = 0 WHERE `stall_id` = 91;

-- 3.9 Create Payment Record
INSERT INTO `payments` (
    `stallholder_id`, `amount`, `payment_date`, `payment_time`,
    `payment_for_month`, `payment_type`, `payment_method`, 
    `payment_status`, `branch_id`, `collected_by`
) VALUES (
    3, 2500.00, '2025-11-28', '14:30:00',
    '2025-12', 'Monthly Rent', 'onsite',
    'completed', 3, 'Admin'
);

-- 3.10 Create Stallholder Documents
INSERT INTO `stallholder_documents` (
    `stallholder_id`, `document_type_id`, `file_path`, `original_filename`,
    `verification_status`, `expiry_date`, `notes`
) VALUES 
(3, 1, '/uploads/docs/ana_business_permit.pdf', 'business_permit.pdf', 'verified', '2025-12-31', 'Business Permit'),
(3, 4, '/uploads/docs/ana_cedula.pdf', 'cedula.pdf', 'verified', '2025-12-31', 'Cedula'),
(3, 5, '/uploads/docs/ana_valid_id.pdf', 'valid_id.pdf', 'verified', '2029-03-20', 'Government ID');


-- ============================================================
-- VERIFICATION: Show all created accounts
-- ============================================================

SELECT '✅ DATABASE CLEANED AND 3 ACCOUNTS CREATED!' as Status;

SELECT 
    '📱 MOBILE LOGIN CREDENTIALS' as Info,
    c.user_name as Username,
    'Test@123' as Password,
    a.applicant_full_name as Name,
    sh.business_name as Business,
    st.stall_no as Stall,
    b.branch_name as Branch,
    sh.contract_status as Status
FROM credential c
INNER JOIN applicant a ON c.applicant_id = a.applicant_id
INNER JOIN stallholder sh ON c.applicant_id = sh.applicant_id
INNER JOIN stall st ON sh.stall_id = st.stall_id
INNER JOIN branch b ON sh.branch_id = b.branch_id
WHERE c.is_active = 1
ORDER BY c.applicant_id;

-- ============================================================
-- SUMMARY OF CREATED ACCOUNTS:
-- ============================================================
-- 
-- | Username   | Password | Name           | Business              | Stall | Branch           |
-- |------------|----------|----------------|----------------------|-------|------------------|
-- | maria2025  | Test@123 | Maria Santos   | Maria's Carinderia   | 54    | Naga Public Mkt  |
-- | juan2025   | Test@123 | Juan Dela Cruz | JDC Electronics      | 55    | Naga Public Mkt  |
-- | ana2025    | Test@123 | Ana Reyes      | Ana's Fashion Corner | 91    | Naga City Mall   |
--
-- Each account has:
-- ✅ Applicant record
-- ✅ Business Information
-- ✅ Other Information (email, signature, ID)
-- ✅ Credential (for mobile login)
-- ✅ Application (Approved)
-- ✅ Stallholder record (links to stall)
-- ✅ Payment record
-- ✅ Document submissions
-- ============================================================
