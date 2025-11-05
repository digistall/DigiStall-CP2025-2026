-- ============================================
-- Mobile Backend - Complete Stored Procedures
-- File: 012_mobile_backend_complete_procedures.sql
-- Purpose: 100% stored procedure coverage for mobile backend
-- ============================================

USE naga_stall;

DELIMITER $$

-- ============================================
-- 1. GET APPLICANT LOGIN CREDENTIALS
-- Used by: loginController.js (line 22)
-- ============================================
DROP PROCEDURE IF EXISTS getApplicantLoginCredentials$$
CREATE PROCEDURE getApplicantLoginCredentials(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT 
        c.registrationid, c.applicant_id, c.user_name, c.password_hash, 
        c.is_active, c.created_date, c.last_login,
        a.applicant_full_name, a.applicant_contact_number, a.applicant_address,
        a.applicant_birthdate, a.applicant_civil_status, a.applicant_educational_attainment
    FROM credential c
    JOIN applicant a ON c.applicant_id = a.applicant_id
    WHERE c.user_name = p_username AND c.is_active = 1;
END$$

-- ============================================
-- 2. GET APPLIED AREAS BY APPLICANT
-- Used by: loginController.js (line 63)
-- ============================================
DROP PROCEDURE IF EXISTS getAppliedAreasByApplicant$$
CREATE PROCEDURE getAppliedAreasByApplicant(
    IN p_applicant_id INT
)
BEGIN
    SELECT DISTINCT b.area, b.branch_id, b.branch_name, b.location
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id;
END$$

-- ============================================
-- 3. GET ALL ACTIVE BRANCHES
-- Used by: loginController.js (line 77)
-- ============================================
DROP PROCEDURE IF EXISTS getAllActiveBranches$$
CREATE PROCEDURE getAllActiveBranches()
BEGIN
    SELECT DISTINCT b.area, b.branch_id, b.branch_name, b.location
    FROM branch b
    WHERE b.is_active = 1
    ORDER BY b.area;
END$$

-- ============================================
-- 4. GET APPLICANT APPLICATIONS DETAILED
-- Used by: loginController.js (line 89)
-- ============================================
DROP PROCEDURE IF EXISTS getApplicantApplicationsDetailed$$
CREATE PROCEDURE getApplicantApplicationsDetailed(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        app.application_id, app.stall_id, app.application_date, app.application_status,
        app.created_at, app.updated_at,
        st.stall_no, st.stall_location, st.size, st.rental_price, st.price_type,
        st.status as stall_status, st.description, st.stall_image,
        sec.section_name, f.floor_name, b.branch_name, b.area, b.location as branch_location,
        b.branch_id
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.created_at DESC;
END$$

-- ============================================
-- 5. GET AVAILABLE STALLS BY AREAS
-- Used by: loginController.js (line 142)
-- Note: This is complex with dynamic WHERE clause
-- We'll create a version that returns all, filter in code
-- ============================================
DROP PROCEDURE IF EXISTS getAvailableStallsByApplicant$$
CREATE PROCEDURE getAvailableStallsByApplicant(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        st.stall_id, st.stall_no, st.stall_location, st.size, st.rental_price, 
        st.price_type, st.status, st.description, st.stall_image, st.is_available,
        sec.section_name, sec.section_id, f.floor_name, f.floor_id, 
        b.branch_name, b.area, b.location, b.branch_id,
        CASE 
            WHEN app_check.stall_id IS NOT NULL THEN 'applied'
            ELSE 'available'
        END as application_status
    FROM stall st
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN application app_check ON st.stall_id = app_check.stall_id AND app_check.applicant_id = p_applicant_id
    WHERE st.is_available = 1 AND st.status = 'Active'
    ORDER BY b.branch_name, f.floor_name, sec.section_name, st.stall_no;
END$$

-- ============================================
-- 6. GET APPLICANT ADDITIONAL INFO
-- Used by: loginController.js (line 154)
-- ============================================
DROP PROCEDURE IF EXISTS getApplicantAdditionalInfo$$
CREATE PROCEDURE getApplicantAdditionalInfo(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        oi.email_address, oi.signature_of_applicant, oi.house_sketch_location, oi.valid_id,
        bi.nature_of_business, bi.capitalization, bi.source_of_capital, 
        bi.previous_business_experience, bi.relative_stall_owner,
        s.spouse_full_name, s.spouse_birthdate, s.spouse_educational_attainment,
        s.spouse_contact_number, s.spouse_occupation
    FROM applicant a
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
    WHERE a.applicant_id = p_applicant_id;
END$$

-- ============================================
-- 7. GET STALL WITH BRANCH INFO
-- Used by: loginController.js submitApplication (line 276)
-- ============================================
DROP PROCEDURE IF EXISTS getStallWithBranchInfo$$
CREATE PROCEDURE getStallWithBranchInfo(
    IN p_stall_id INT
)
BEGIN
    SELECT st.stall_id, st.is_available, st.status, b.branch_id, b.branch_name
    FROM stall st
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE st.stall_id = p_stall_id;
END$$

-- ============================================
-- 8. CHECK EXISTING APPLICATION
-- Used by: loginController.js (line 303)
-- ============================================
DROP PROCEDURE IF EXISTS checkExistingApplication$$
CREATE PROCEDURE checkExistingApplication(
    IN p_applicant_id INT,
    IN p_stall_id INT
)
BEGIN
    SELECT application_id 
    FROM application 
    WHERE applicant_id = p_applicant_id AND stall_id = p_stall_id;
END$$

-- ============================================
-- 9. COUNT APPLICATIONS BY BRANCH
-- Used by: loginController.js (line 316)
-- ============================================
DROP PROCEDURE IF EXISTS countApplicationsByBranch$$
CREATE PROCEDURE countApplicationsByBranch(
    IN p_applicant_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT COUNT(*) as count 
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id AND b.branch_id = p_branch_id;
END$$

-- ============================================
-- MOBILE APPLICATION CONTROLLER PROCEDURES
-- ============================================

-- 10. CHECK STALL AVAILABILITY (mobileApplicationController line 35)
DROP PROCEDURE IF EXISTS checkStallAvailability$$
CREATE PROCEDURE checkStallAvailability(
    IN p_stall_id INT
)
BEGIN
    SELECT stall_id, stall_name, area, branch_id, is_available 
    FROM stalls 
    WHERE stall_id = p_stall_id;
END$$

-- 11. CHECK EXISTING APPLICATION (mobileApplicationController line 56)
DROP PROCEDURE IF EXISTS checkExistingApplicationByStall$$
CREATE PROCEDURE checkExistingApplicationByStall(
    IN p_applicant_id INT,
    IN p_stall_id INT
)
BEGIN
    SELECT application_id 
    FROM applications 
    WHERE applicant_id = p_applicant_id AND stall_id = p_stall_id;
END$$

-- 12. COUNT BRANCH APPLICATIONS (mobileApplicationController line 69)
DROP PROCEDURE IF EXISTS countBranchApplications$$
CREATE PROCEDURE countBranchApplications(
    IN p_applicant_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT COUNT(*) as count 
    FROM applications a 
    JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.applicant_id = p_applicant_id 
      AND s.branch_id = p_branch_id 
      AND a.status != 'rejected';
END$$

-- 13. CREATE MOBILE APPLICATION (mobileApplicationController line 85)
DROP PROCEDURE IF EXISTS createMobileApplication$$
CREATE PROCEDURE createMobileApplication(
    IN p_applicant_id INT,
    IN p_stall_id INT,
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_preferred_area VARCHAR(255),
    IN p_document_urls TEXT
)
BEGIN
    INSERT INTO applications 
    (applicant_id, stall_id, business_name, business_type, preferred_area, 
     document_urls, status, created_at) 
    VALUES (p_applicant_id, p_stall_id, p_business_name, p_business_type, 
            p_preferred_area, p_document_urls, 'pending', NOW());
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

-- 14. GET USER APPLICATIONS (mobileApplicationController line 132)
DROP PROCEDURE IF EXISTS getMobileUserApplications$$
CREATE PROCEDURE getMobileUserApplications(
    IN p_user_id INT
)
BEGIN
    SELECT a.*, s.stall_name, s.area, s.location 
    FROM applications a 
    LEFT JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.applicant_id = p_user_id 
    ORDER BY a.created_at DESC;
END$$

-- 15. GET APPLICATION STATUS (mobileApplicationController line 169)
DROP PROCEDURE IF EXISTS getMobileApplicationStatus$$
CREATE PROCEDURE getMobileApplicationStatus(
    IN p_application_id INT,
    IN p_user_id INT
)
BEGIN
    SELECT a.*, s.stall_name, s.area, s.location 
    FROM applications a 
    LEFT JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.application_id = p_application_id AND a.applicant_id = p_user_id;
END$$

-- 16. CHECK PENDING APPLICATION (mobileApplicationController line 219)
DROP PROCEDURE IF EXISTS checkPendingApplication$$
CREATE PROCEDURE checkPendingApplication(
    IN p_application_id INT,
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM applications 
    WHERE application_id = p_application_id 
      AND applicant_id = p_applicant_id 
      AND status = 'pending';
END$$

-- 17. UPDATE MOBILE APPLICATION (mobileApplicationController line 232)
DROP PROCEDURE IF EXISTS updateMobileApplication$$
CREATE PROCEDURE updateMobileApplication(
    IN p_application_id INT,
    IN p_applicant_id INT,
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_preferred_area VARCHAR(255),
    IN p_document_urls TEXT
)
BEGIN
    UPDATE applications 
    SET business_name = p_business_name, 
        business_type = p_business_type, 
        preferred_area = p_preferred_area, 
        document_urls = p_document_urls, 
        updated_at = NOW() 
    WHERE application_id = p_application_id 
      AND applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- ============================================
-- MOBILE AUTH CONTROLLER PROCEDURES
-- ============================================

-- 18. GET MOBILE USER BY USERNAME (mobileAuthController line 24)
DROP PROCEDURE IF EXISTS getMobileUserByUsername$$
CREATE PROCEDURE getMobileUserByUsername(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id, 
        c.user_name, 
        c.password_hash,
        c.is_active,
        a.applicant_full_name,
        a.applicant_email,
        a.applicant_contact_number
    FROM credential c
    LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
    WHERE c.user_name = p_username AND c.is_active = 1;
END$$

-- 19. CHECK EXISTING USER (mobileAuthController line 127)
DROP PROCEDURE IF EXISTS checkExistingMobileUser$$
CREATE PROCEDURE checkExistingMobileUser(
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM applicant 
    WHERE applicant_username = p_username OR applicant_email = p_email;
END$$

-- 20. REGISTER MOBILE USER (mobileAuthController line 144)
DROP PROCEDURE IF EXISTS registerMobileUser$$
CREATE PROCEDURE registerMobileUser(
    IN p_full_name VARCHAR(255),
    IN p_contact_number VARCHAR(20),
    IN p_address TEXT,
    IN p_username VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    INSERT INTO applicant (
        applicant_full_name, 
        applicant_contact_number, 
        applicant_address,
        applicant_username, 
        applicant_email, 
        applicant_password_hash,
        email_verified,
        created_at
    ) VALUES (
        p_full_name, 
        p_contact_number, 
        p_address, 
        p_username, 
        p_email, 
        p_password_hash,
        FALSE, 
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as applicant_id;
END$$

DELIMITER ;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify all procedures were created:
-- SHOW PROCEDURE STATUS WHERE db = 'naga_stall' AND name LIKE '%mobile%' OR name LIKE '%Applicant%';
-- SELECT COUNT(*) as total_procedures FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'naga_stall' AND ROUTINE_TYPE = 'PROCEDURE';

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
SELECT '✅ Mobile Backend Procedures Created Successfully!' as status,
       '20 stored procedures created for 100% mobile backend coverage' as message;
