-- Migration 315: Mobile Auth Controller Stored Procedures
-- This creates stored procedures for mobile authentication queries

DELIMITER //

-- =====================================================
-- SP: sp_getSpouseByApplicantId
-- Purpose: Get spouse information for an applicant
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getSpouseByApplicantId//
CREATE PROCEDURE sp_getSpouseByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM spouse WHERE applicant_id = p_applicant_id;
END//

-- =====================================================
-- SP: sp_getBusinessInfoByApplicantId
-- Purpose: Get business information for an applicant
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessInfoByApplicantId//
CREATE PROCEDURE sp_getBusinessInfoByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM business_information WHERE applicant_id = p_applicant_id;
END//

-- =====================================================
-- SP: sp_getOtherInfoByApplicantId
-- Purpose: Get other information for an applicant
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getOtherInfoByApplicantId//
CREATE PROCEDURE sp_getOtherInfoByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM other_information WHERE applicant_id = p_applicant_id;
END//

-- =====================================================
-- SP: sp_getLatestApplicationByApplicantId
-- Purpose: Get latest application with stall and branch info
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getLatestApplicationByApplicantId//
CREATE PROCEDURE sp_getLatestApplicationByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        app.application_id,
        app.stall_id,
        app.application_status,
        app.application_date,
        s.stall_no,
        s.rental_price,
        s.stall_location,
        s.size,
        sec.section_id,
        f.floor_id,
        b.branch_id,
        b.branch_name
    FROM application app
    LEFT JOIN stall s ON app.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getStallholderByApplicantId
-- Purpose: Get stallholder information with stall and branch details
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallholderByApplicantId//
CREATE PROCEDURE sp_getStallholderByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.branch_id,
        sh.stall_id,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.lease_amount,
        sh.monthly_rent,
        sh.payment_status,
        sh.compliance_status,
        s.stall_no,
        s.stall_location,
        s.size,
        b.branch_name
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id;
END//

-- =====================================================
-- SP: sp_getApplicantById
-- Purpose: Get applicant full details by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getApplicantById//
CREATE PROCEDURE sp_getApplicantById(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM applicant WHERE applicant_id = p_applicant_id;
END//

-- =====================================================
-- SP: sp_updateCredentialLastLogout
-- Purpose: Update last_logout in credential table
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateCredentialLastLogout//
CREATE PROCEDURE sp_updateCredentialLastLogout(
    IN p_applicant_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE credential SET last_logout = p_logout_time WHERE applicant_id = p_applicant_id;
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

-- Success message
SELECT 'Mobile Auth Controller stored procedures created successfully' as status;
