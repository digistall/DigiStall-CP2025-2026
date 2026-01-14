-- Migration 320: Mobile Login Stored Procedures
-- This creates stored procedures for mobile login operations

DELIMITER //

-- =====================================================
-- SP: sp_getCredentialWithApplicant
-- Purpose: Get credential with applicant info for mobile login
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getCredentialWithApplicant//
CREATE PROCEDURE sp_getCredentialWithApplicant(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.created_date,
        c.last_login,
        c.is_active,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        COALESCE(a.applicant_email, oi.email_address) as applicant_email
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username 
        AND c.is_active = 1
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getFullStallholderInfo
-- Purpose: Get full stallholder information
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getFullStallholderInfo//
CREATE PROCEDURE sp_getFullStallholderInfo(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.business_type,
        sh.contact_number as stallholder_contact,
        sh.email as stallholder_email,
        sh.address as stallholder_address,
        sh.branch_id,
        sh.stall_id,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.compliance_status,
        sh.payment_status,
        s.stall_no,
        s.size,
        s.rental_price as monthly_rent,
        s.stall_location,
        b.branch_name,
        b.area as branch_area
    FROM stallholder sh
    INNER JOIN stall s ON sh.stall_id = s.stall_id
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getLatestApplicationInfo
-- Purpose: Get latest application info for applicant
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getLatestApplicationInfo//
CREATE PROCEDURE sp_getLatestApplicationInfo(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        app.application_id,
        app.stall_id,
        app.application_status as status,
        app.application_date,
        s.stall_no,
        s.rental_price,
        b.branch_name
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_countBranchApplicationsForApplicant
-- Purpose: Count applications in a branch for applicant
-- =====================================================
DROP PROCEDURE IF EXISTS sp_countBranchApplicationsForApplicant//
CREATE PROCEDURE sp_countBranchApplicationsForApplicant(
    IN p_applicant_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT COUNT(*) as count 
    FROM application app
    JOIN stall s ON app.stall_id = s.stall_id
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id AND b.branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_updateCredentialLastLogin
-- Purpose: Update last login timestamp
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateCredentialLastLogin//
CREATE PROCEDURE sp_updateCredentialLastLogin(
    IN p_applicant_id INT
)
BEGIN
    UPDATE credential 
    SET last_login = NOW() 
    WHERE applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

-- Success message
SELECT 'Mobile Login stored procedures created successfully' as status;
