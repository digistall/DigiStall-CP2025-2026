-- ========================================
-- NAGA STALL - MASTER DATABASE RESET
-- ========================================
-- Version: 2.0 (Complete Clean Reset)
-- Date: January 15, 2026
-- 
-- IMPORTANT: This will DELETE ALL DATA and recreate the database!
-- Run this script to completely reset the database.
--
-- Encryption: AES-256-GCM is handled in Node.js, NOT in MySQL
-- Encrypted fields store data in format: iv:authTag:encryptedData
-- ========================================

-- ========================================
-- STEP 1: DROP ALL EXISTING PROCEDURES, FUNCTIONS, EVENTS, VIEWS
-- ========================================

USE naga_stall;

-- Drop all procedures
DROP PROCEDURE IF EXISTS addInspector;
DROP PROCEDURE IF EXISTS addOnsitePayment;
DROP PROCEDURE IF EXISTS checkComplianceRecordExists;
DROP PROCEDURE IF EXISTS checkExistingApplication;
DROP PROCEDURE IF EXISTS checkExistingMobileUser;
DROP PROCEDURE IF EXISTS checkPendingApplication;
DROP PROCEDURE IF EXISTS checkStallAvailability;
DROP PROCEDURE IF EXISTS countBranchApplications;
DROP PROCEDURE IF EXISTS createApplicant;
DROP PROCEDURE IF EXISTS createApplicantComplete;
DROP PROCEDURE IF EXISTS createApplication;
DROP PROCEDURE IF EXISTS createBranch;
DROP PROCEDURE IF EXISTS createBusinessEmployee;
DROP PROCEDURE IF EXISTS createBusinessEmployee_Encrypted;
DROP PROCEDURE IF EXISTS createBusinessOwnerWithManagerConnection;
DROP PROCEDURE IF EXISTS createCollector;
DROP PROCEDURE IF EXISTS createCollector_Encrypted;
DROP PROCEDURE IF EXISTS createComplaint;
DROP PROCEDURE IF EXISTS createComplianceRecord;
DROP PROCEDURE IF EXISTS createFloor;
DROP PROCEDURE IF EXISTS createInspector_Encrypted;
DROP PROCEDURE IF EXISTS createSection;
DROP PROCEDURE IF EXISTS createStallholder;
DROP PROCEDURE IF EXISTS createStallholder_Encrypted;
DROP PROCEDURE IF EXISTS createVendorWithRelations;
DROP PROCEDURE IF EXISTS deleteApplicant;
DROP PROCEDURE IF EXISTS deleteApplication;
DROP PROCEDURE IF EXISTS deleteBranch;
DROP PROCEDURE IF EXISTS deleteComplaint;
DROP PROCEDURE IF EXISTS deleteComplianceRecord;
DROP PROCEDURE IF EXISTS deleteFloor;
DROP PROCEDURE IF EXISTS deleteSection;
DROP PROCEDURE IF EXISTS deleteVendorWithRelations;
DROP PROCEDURE IF EXISTS getAllActiveBranches;
DROP PROCEDURE IF EXISTS getAllActiveInspectors;
DROP PROCEDURE IF EXISTS getAllApplicantsDecrypted;
DROP PROCEDURE IF EXISTS getAllApplications;
DROP PROCEDURE IF EXISTS getAllBranchesDetailed;
DROP PROCEDURE IF EXISTS getAllBusinessEmployees;
DROP PROCEDURE IF EXISTS getAllComplaintsDecrypted;
DROP PROCEDURE IF EXISTS getAllComplianceRecordsDecrypted;
DROP PROCEDURE IF EXISTS getAllSubscriptionPlans;
DROP PROCEDURE IF EXISTS getAllVendorsWithRelations;
DROP PROCEDURE IF EXISTS getAllViolationTypes;
DROP PROCEDURE IF EXISTS getApplicantAdditionalInfo;
DROP PROCEDURE IF EXISTS getApplicantApplicationsDetailed;
DROP PROCEDURE IF EXISTS getApplicantByEmail;
DROP PROCEDURE IF EXISTS getApplicantById;
DROP PROCEDURE IF EXISTS getApplicantComplete;
DROP PROCEDURE IF EXISTS getApplicationsByApplicant;
DROP PROCEDURE IF EXISTS getAppliedAreasByApplicant;
DROP PROCEDURE IF EXISTS getAvailableStallsByApplicant;
DROP PROCEDURE IF EXISTS getBusinessEmployeeById;
DROP PROCEDURE IF EXISTS getBusinessEmployeeByUsername;
DROP PROCEDURE IF EXISTS getBusinessEmployeesByBranch;
DROP PROCEDURE IF EXISTS getBusinessManagerByUsername;
DROP PROCEDURE IF EXISTS getBusinessOwnerPaymentHistory;
DROP PROCEDURE IF EXISTS getBusinessOwnerSubscription;
DROP PROCEDURE IF EXISTS getComplaintById;
DROP PROCEDURE IF EXISTS getComplianceRecordById;
DROP PROCEDURE IF EXISTS getComplianceRecordByIdDecrypted;
DROP PROCEDURE IF EXISTS getComplianceStatistics;
DROP PROCEDURE IF EXISTS getEmailTemplate;
DROP PROCEDURE IF EXISTS getMobileApplicationStatus;
DROP PROCEDURE IF EXISTS getMobileUserApplications;
DROP PROCEDURE IF EXISTS getStallBusinessOwnerByUsernameLogin;
DROP PROCEDURE IF EXISTS getStallholderBranchId;
DROP PROCEDURE IF EXISTS getStallholderById;
DROP PROCEDURE IF EXISTS getStallholdersByBranch;
DROP PROCEDURE IF EXISTS getStallholdersByBranchDecrypted;
DROP PROCEDURE IF EXISTS getStallsFiltered;
DROP PROCEDURE IF EXISTS getStallWithBranchInfo;
DROP PROCEDURE IF EXISTS getUnpaidViolationsByStallholder;
DROP PROCEDURE IF EXISTS getVendorWithRelations;
DROP PROCEDURE IF EXISTS getViolationHistoryByStallholder;
DROP PROCEDURE IF EXISTS getViolationPenaltiesByViolationId;
DROP PROCEDURE IF EXISTS loginBusinessEmployee;
DROP PROCEDURE IF EXISTS registerMobileUser;
DROP PROCEDURE IF EXISTS registerMobileUser_Encrypted;
DROP PROCEDURE IF EXISTS removeBranchDocumentRequirement;
DROP PROCEDURE IF EXISTS reportStallholder;
DROP PROCEDURE IF EXISTS resetBusinessEmployeePassword;
DROP PROCEDURE IF EXISTS revokeAllUserTokens;
DROP PROCEDURE IF EXISTS updateApplicantComplete;
DROP PROCEDURE IF EXISTS updateBusinessEmployee;
DROP PROCEDURE IF EXISTS updateCollector;
DROP PROCEDURE IF EXISTS updateCredentialLastLogin;
DROP PROCEDURE IF EXISTS updateInspector;
DROP PROCEDURE IF EXISTS updateVendorWithRelations;

-- Drop all sp_ procedures (there are many, this covers the main ones)
-- The actual drop will happen when we run the schema reset

-- Drop all functions
DROP FUNCTION IF EXISTS fn_decrypt;
DROP FUNCTION IF EXISTS fn_decrypt_stallholder_name;
DROP FUNCTION IF EXISTS fn_encrypt;
DROP FUNCTION IF EXISTS fn_getEncryptionKey;
DROP FUNCTION IF EXISTS fn_getPhilippineTime;
DROP FUNCTION IF EXISTS fn_philippine_now;

-- Drop all events
DROP EVENT IF EXISTS reset_monthly_payment_status;

-- Drop all views
DROP VIEW IF EXISTS active_auctions_view;
DROP VIEW IF EXISTS active_raffles_view;
DROP VIEW IF EXISTS penalty_payments_view;
DROP VIEW IF EXISTS stalls_with_raffle_auction_view;
DROP VIEW IF EXISTS view_applicant_documents_by_owner;
DROP VIEW IF EXISTS view_applicant_required_documents;
DROP VIEW IF EXISTS view_compliance_records;
DROP VIEW IF EXISTS view_compliant_stallholders;
DROP VIEW IF EXISTS view_inspector_activity_log;
DROP VIEW IF EXISTS view_violation_penalty;

-- ========================================
-- STEP 2: SOURCE THE CLEAN SCHEMA
-- ========================================
-- Note: Run CLEAN_DATABASE_SCHEMA.sql separately or copy its contents here

-- ========================================
-- STEP 3: SOURCE THE STORED PROCEDURES
-- ========================================
-- Note: Run STORED_PROCEDURES_PART1.sql, PART2.sql, PART3.sql separately

-- ========================================
-- STEP 4: INSERT INITIAL DATA (uses INSERT IGNORE to allow re-runs)
-- ========================================

-- System Administrator (password: admin123)
INSERT IGNORE INTO system_administrator (admin_username, admin_password_hash, first_name, last_name, email, status)
VALUES ('admin', SHA2('admin123', 256), 'System', 'Administrator', 'admin@digistall.com', 'Active');

-- Subscription Plans
INSERT IGNORE INTO subscription_plans (plan_name, plan_description, price, duration_months, max_branches, max_stalls, status) VALUES
('Basic', 'Basic plan for small markets', 999.00, 1, 1, 20, 'Active'),
('Standard', 'Standard plan for medium markets', 2499.00, 1, 3, 50, 'Active'),
('Premium', 'Premium plan for large markets', 4999.00, 1, 10, 200, 'Active');

-- Violation Types
INSERT IGNORE INTO violation (violation_type, description, default_penalty, status) VALUES
('Late Payment', 'Failure to pay rent on time', 100.00, 'Active'),
('Unauthorized Modification', 'Modifying stall without permission', 500.00, 'Active'),
('Health Violation', 'Violation of health and sanitation rules', 1000.00, 'Active'),
('Noise Disturbance', 'Excessive noise that disturbs other stallholders', 200.00, 'Active'),
('Unauthorized Subletting', 'Subletting stall without permission', 2000.00, 'Active');

-- Violation Penalties (by offense level)
INSERT IGNORE INTO violation_penalty (violation_id, offense_level, penalty_amount, description) VALUES
(1, '1st', 100.00, 'First offense - Warning with penalty'),
(1, '2nd', 200.00, 'Second offense'),
(1, '3rd', 500.00, 'Third offense'),
(1, '4th', 1000.00, 'Fourth offense'),
(1, '5th', 2000.00, 'Fifth offense - Final warning'),
(2, '1st', 500.00, 'First offense'),
(2, '2nd', 1000.00, 'Second offense'),
(2, '3rd', 2000.00, 'Third offense - Contract termination warning'),
(3, '1st', 1000.00, 'First offense - Immediate action required'),
(3, '2nd', 2000.00, 'Second offense'),
(3, '3rd', 5000.00, 'Third offense - Contract termination');

-- Document Types
INSERT IGNORE INTO document_types (document_name, description, is_required, status) VALUES
('Valid ID', 'Government-issued valid ID', 1, 'Active'),
('Proof of Address', 'Utility bill or barangay certificate', 1, 'Active'),
('Business Permit', 'DTI registration or business permit', 0, 'Active'),
('Health Certificate', 'Health certificate from local health office', 0, 'Active'),
('Police Clearance', 'NBI or Police clearance', 0, 'Active'),
('Barangay Clearance', 'Clearance from local barangay', 1, 'Active'),
('Photo', 'Recent 2x2 ID photo', 1, 'Active'),
('Contract', 'Signed stall rental contract', 0, 'Active');

-- Email Templates
INSERT IGNORE INTO employee_email_template (template_name, template_subject, template_body) VALUES
('Welcome', 'Welcome to DigiStall!', 'Dear {name},\n\nWelcome to DigiStall! Your account has been created successfully.\n\nUsername: {username}\nTemporary Password: {password}\n\nPlease change your password upon first login.\n\nBest regards,\nDigiStall Team'),
('Password Reset', 'Password Reset Request', 'Dear {name},\n\nA password reset has been requested for your account.\n\nYour new temporary password is: {password}\n\nPlease change your password after logging in.\n\nBest regards,\nDigiStall Team');

-- ========================================
-- STEP 5: CREATE UTILITY FUNCTIONS
-- ========================================

DELIMITER $$

-- Function to get Philippine time
DROP FUNCTION IF EXISTS fn_philippine_now$$
CREATE FUNCTION fn_philippine_now()
RETURNS DATETIME
DETERMINISTIC
BEGIN
    RETURN CONVERT_TZ(NOW(), @@session.time_zone, '+08:00');
END$$

-- Function to get Philippine time (alias)
DROP FUNCTION IF EXISTS fn_getPhilippineTime$$
CREATE FUNCTION fn_getPhilippineTime()
RETURNS DATETIME
DETERMINISTIC
BEGIN
    RETURN CONVERT_TZ(NOW(), @@session.time_zone, '+08:00');
END$$

DELIMITER ;

-- ========================================
-- STEP 6: CREATE EVENT FOR MONTHLY PAYMENT RESET
-- ========================================

DELIMITER $$

CREATE EVENT IF NOT EXISTS reset_monthly_payment_status
ON SCHEDULE EVERY 1 MONTH
STARTS CONCAT(DATE_FORMAT(DATE_ADD(CURDATE(), INTERVAL 1 MONTH), '%Y-%m'), '-01 00:00:00')
DO
BEGIN
    -- Reset payment status to unpaid at the start of each month
    UPDATE stallholder 
    SET payment_status = 'unpaid'
    WHERE status = 'active';
    
    -- Log the reset
    INSERT INTO payment_status_log (stallholder_id, previous_status, new_status, changed_by)
    SELECT stallholder_id, 'paid', 'unpaid', 'Monthly Reset Event'
    FROM stallholder WHERE status = 'active';
END$$

DELIMITER ;

-- ========================================
-- STEP 7: CREATE USEFUL VIEWS
-- ========================================

-- View for active inspectors with branch info
CREATE OR REPLACE VIEW view_active_inspectors AS
SELECT 
    i.inspector_id,
    i.inspector_username,
    i.first_name,
    i.last_name,
    i.email,
    i.contact_no,
    i.status,
    ia.branch_id,
    b.branch_name
FROM inspector i
LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
LEFT JOIN branch b ON ia.branch_id = b.branch_id
WHERE i.status = 'active';

-- View for active collectors with branch info
CREATE OR REPLACE VIEW view_active_collectors AS
SELECT 
    c.collector_id,
    c.collector_username,
    c.first_name,
    c.last_name,
    c.email,
    c.contact_no,
    c.status,
    ca.branch_id,
    b.branch_name
FROM collector c
LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
LEFT JOIN branch b ON ca.branch_id = b.branch_id
WHERE c.status = 'active';

-- View for violation penalties
CREATE OR REPLACE VIEW view_violation_penalty AS
SELECT 
    v.violation_id,
    v.violation_type,
    v.description AS violation_description,
    vp.penalty_id,
    vp.offense_level,
    vp.penalty_amount,
    vp.description AS penalty_description
FROM violation v
INNER JOIN violation_penalty vp ON v.violation_id = vp.violation_id
WHERE v.status = 'Active'
ORDER BY v.violation_type, vp.offense_level;

-- View for stall availability
CREATE OR REPLACE VIEW view_available_stalls AS
SELECT 
    st.stall_id,
    st.stall_number,
    st.stall_name,
    st.stall_type,
    st.size,
    st.monthly_rent,
    sec.section_name,
    f.floor_name,
    b.branch_id,
    b.branch_name,
    b.area
FROM stall st
INNER JOIN section sec ON st.section_id = sec.section_id
INNER JOIN floor f ON sec.floor_id = f.floor_id
INNER JOIN branch b ON st.branch_id = b.branch_id
WHERE st.is_available = 1 AND st.status = 'Available';

-- ========================================
-- DONE
-- ========================================

SELECT '✅ Database reset complete!' AS status;
SELECT 'System Admin Login: admin / admin123' AS info;
SELECT 'Remember: All sensitive data is encrypted in Node.js using AES-256-GCM' AS note;
