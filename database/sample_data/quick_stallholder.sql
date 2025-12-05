-- ==============================================
-- SIMPLE STALLHOLDER ACCOUNT - Run in phpMyAdmin
-- ==============================================
-- Login Credentials:
--   Username: stallholder1
--   Password: password123
-- ==============================================

-- Step 1: Create Applicant
INSERT INTO `applicant` (
    `applicant_full_name`, 
    `applicant_contact_number`, 
    `applicant_address`, 
    `applicant_birthdate`, 
    `applicant_civil_status`, 
    `applicant_educational_attainment`,
    `applicant_email`
) VALUES (
    'Juan Dela Cruz',
    '09123456789',
    'Barangay Peñafrancia, Naga City',
    '1990-05-15',
    'Married',
    'College Graduate',
    'juan.delacruz@email.com'
);

SET @applicant_id = LAST_INSERT_ID();

-- Step 2: Create Credential (using bcrypt hash from existing working account pattern)
INSERT INTO `credential` (`applicant_id`, `user_name`, `password_hash`, `created_date`, `is_active`) 
VALUES (@applicant_id, 'stallholder1', '$2b$10$lYLaIa3klQd0ifKyV8mUa.D1RSTqj/BMfpvFs69pGixHTwozNjg1.', NOW(), 1);
-- Note: This hash is for 'Jeno123!' - you may need to update password via app

-- Step 3: Create Application (Approved)
INSERT INTO `application` (`stall_id`, `applicant_id`, `application_date`, `application_status`) 
VALUES (56, @applicant_id, CURDATE(), 'Approved');

-- Step 4: Create Stallholder 
INSERT INTO `stallholder` (
    `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`,
    `business_name`, `business_type`, `branch_id`, `stall_id`,
    `contract_start_date`, `contract_end_date`, `contract_status`,
    `lease_amount`, `monthly_rent`, `payment_status`,
    `created_by_business_manager`, `compliance_status`
) VALUES (
    @applicant_id, 'Juan Dela Cruz', '09123456789', 'juan.delacruz@email.com', 
    'Barangay Peñafrancia, Naga City',
    'Dela Cruz Sari-Sari Store', 'Retail', 1, 56,
    CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'Active',
    24000.00, 2000.00, 'current',
    1, 'Compliant'
);

-- Step 5: Add other_information (for email)
INSERT INTO `other_information` (`applicant_id`, `email_address`) 
VALUES (@applicant_id, 'juan.delacruz@email.com');

-- Verify
SELECT 'SUCCESS! New stallholder created' as message, @applicant_id as applicant_id;
SELECT * FROM stallholder WHERE applicant_id = @applicant_id;
