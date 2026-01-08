-- =====================================================
-- MIGRATION 405: Remaining CRUD Stored Procedures
-- Complete coverage for all remaining raw SQL queries
-- =====================================================

DELIMITER //

-- =====================================================
-- APPLICANT APPROVAL/DECLINE STORED PROCEDURES
-- =====================================================

-- SP: sp_getApplicantWithApplicationDetails
DROP PROCEDURE IF EXISTS sp_getApplicantWithApplicationDetails//
CREATE PROCEDURE sp_getApplicantWithApplicationDetails(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_first_name,
        a.applicant_middle_name,
        a.applicant_last_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        app.application_id,
        app.application_status,
        app.stall_id,
        s.stall_number,
        s.stall_size,
        s.rental_fee,
        sec.section_name,
        f.floor_number,
        b.branch_name,
        b.branch_id,
        bi.business_name,
        bi.business_type,
        bi.business_description,
        oi.valid_id_type,
        oi.valid_id_number,
        sp.spouse_full_name,
        sp.spouse_occupation
    FROM applicant a
    LEFT JOIN application app ON a.applicant_id = app.applicant_id
    LEFT JOIN stall s ON app.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
    WHERE a.applicant_id = p_applicant_id;
END//

-- SP: sp_approveApplication
DROP PROCEDURE IF EXISTS sp_approveApplication//
CREATE PROCEDURE sp_approveApplication(
    IN p_applicant_id INT,
    IN p_approver_type VARCHAR(50),
    IN p_approver_id INT
)
BEGIN
    DECLARE v_application_id INT;
    DECLARE v_stall_id INT;
    
    -- Get application and stall info
    SELECT application_id, stall_id INTO v_application_id, v_stall_id
    FROM application WHERE applicant_id = p_applicant_id;
    
    -- Update application status
    UPDATE application SET
        application_status = 'approved',
        approved_by_type = p_approver_type,
        approved_by_id = p_approver_id,
        approved_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    -- Update stall status
    IF v_stall_id IS NOT NULL THEN
        UPDATE stall SET status = 'Occupied' WHERE stall_id = v_stall_id;
    END IF;
    
    SELECT v_application_id as application_id, v_stall_id as stall_id, 'approved' as status;
END//

-- SP: sp_deleteApplicantCascade
DROP PROCEDURE IF EXISTS sp_deleteApplicantCascade//
CREATE PROCEDURE sp_deleteApplicantCascade(
    IN p_applicant_id INT
)
BEGIN
    DECLARE v_application_id INT;
    
    -- Get application id
    SELECT application_id INTO v_application_id 
    FROM application WHERE applicant_id = p_applicant_id;
    
    -- Delete in order to maintain referential integrity
    DELETE FROM uploaded_requirements WHERE application_id = v_application_id;
    DELETE FROM application WHERE applicant_id = p_applicant_id;
    DELETE FROM business_information WHERE applicant_id = p_applicant_id;
    DELETE FROM spouse WHERE applicant_id = p_applicant_id;
    DELETE FROM other_information WHERE applicant_id = p_applicant_id;
    DELETE FROM applicant WHERE applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as deleted_count;
END//

-- SP: sp_declineApplication
DROP PROCEDURE IF EXISTS sp_declineApplication//
CREATE PROCEDURE sp_declineApplication(
    IN p_applicant_id INT,
    IN p_declined_by_type VARCHAR(50),
    IN p_declined_by_id INT,
    IN p_reason TEXT
)
BEGIN
    -- Update application status
    UPDATE application SET
        application_status = 'declined',
        declined_by_type = p_declined_by_type,
        declined_by_id = p_declined_by_id,
        declined_reason = p_reason,
        declined_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    -- Delete cascade
    CALL sp_deleteApplicantCascade(p_applicant_id);
    
    SELECT 'declined' as status;
END//

-- =====================================================
-- CREDENTIAL STORED PROCEDURES
-- =====================================================

-- SP: sp_checkUsernameExists
DROP PROCEDURE IF EXISTS sp_checkUsernameExists//
CREATE PROCEDURE sp_checkUsernameExists(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT credential_id, username, applicant_id
    FROM credential
    WHERE username = p_username;
END//

-- SP: sp_createCredential
DROP PROCEDURE IF EXISTS sp_createCredential//
CREATE PROCEDURE sp_createCredential(
    IN p_applicant_id INT,
    IN p_username VARCHAR(100),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    INSERT INTO credential (applicant_id, username, password_hash, created_at)
    VALUES (p_applicant_id, p_username, p_password_hash, NOW());
    
    SELECT LAST_INSERT_ID() as credential_id;
END//

-- SP: sp_updateCredential
DROP PROCEDURE IF EXISTS sp_updateCredential//
CREATE PROCEDURE sp_updateCredential(
    IN p_credential_id INT,
    IN p_username VARCHAR(100),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    UPDATE credential SET
        username = COALESCE(p_username, username),
        password_hash = COALESCE(p_password_hash, password_hash),
        updated_at = NOW()
    WHERE credential_id = p_credential_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_getCredentialByApplicantId
DROP PROCEDURE IF EXISTS sp_getCredentialByApplicantId//
CREATE PROCEDURE sp_getCredentialByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT credential_id, username, applicant_id, created_at
    FROM credential
    WHERE applicant_id = p_applicant_id;
END//

-- SP: sp_getAllCredentials
DROP PROCEDURE IF EXISTS sp_getAllCredentials//
CREATE PROCEDURE sp_getAllCredentials()
BEGIN
    SELECT 
        c.credential_id,
        c.username,
        c.applicant_id,
        c.created_at,
        a.applicant_full_name,
        a.applicant_first_name,
        a.applicant_last_name,
        s.stallholder_id,
        s.stallholder_name,
        s.business_name
    FROM credential c
    LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN stallholder s ON a.applicant_id = s.applicant_id
    ORDER BY c.created_at DESC;
END//

-- =====================================================
-- STALLHOLDER IMPORT/EXPORT STORED PROCEDURES
-- =====================================================

-- SP: sp_getFloorsWithSections
DROP PROCEDURE IF EXISTS sp_getFloorsWithSections//
CREATE PROCEDURE sp_getFloorsWithSections(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        f.floor_id,
        f.floor_number,
        f.floor_name,
        f.branch_id,
        sec.section_id,
        sec.section_name,
        (SELECT COUNT(*) FROM stall st WHERE st.section_id = sec.section_id) as stall_count
    FROM floor f
    LEFT JOIN section sec ON f.floor_id = sec.floor_id
    WHERE f.branch_id = p_branch_id
    ORDER BY f.floor_number, sec.section_name;
END//

-- SP: sp_getAvailableStallsForImport
DROP PROCEDURE IF EXISTS sp_getAvailableStallsForImport//
CREATE PROCEDURE sp_getAvailableStallsForImport(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_size,
        s.rental_fee,
        s.status,
        sec.section_id,
        sec.section_name,
        f.floor_id,
        f.floor_number
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    WHERE f.branch_id = p_branch_id
    AND (s.status = 'Available' OR s.status = 'available')
    ORDER BY f.floor_number, sec.section_name, s.stall_number;
END//

-- SP: sp_getStallByNumberAndSection
DROP PROCEDURE IF EXISTS sp_getStallByNumberAndSection//
CREATE PROCEDURE sp_getStallByNumberAndSection(
    IN p_stall_number VARCHAR(50),
    IN p_section_id INT
)
BEGIN
    SELECT 
        s.stall_id,
        s.stall_number,
        s.stall_size,
        s.rental_fee,
        s.status
    FROM stall s
    WHERE s.stall_number = p_stall_number
    AND s.section_id = p_section_id;
END//

-- SP: sp_createStall
DROP PROCEDURE IF EXISTS sp_createStall//
CREATE PROCEDURE sp_createStall(
    IN p_stall_number VARCHAR(50),
    IN p_section_id INT,
    IN p_stall_size VARCHAR(50),
    IN p_rental_fee DECIMAL(10,2),
    IN p_status VARCHAR(50)
)
BEGIN
    INSERT INTO stall (stall_number, section_id, stall_size, rental_fee, status, created_at)
    VALUES (p_stall_number, p_section_id, p_stall_size, p_rental_fee, COALESCE(p_status, 'Available'), NOW());
    
    SELECT LAST_INSERT_ID() as stall_id;
END//

-- SP: sp_getStallholderMasterlist
DROP PROCEDURE IF EXISTS sp_getStallholderMasterlist//
CREATE PROCEDURE sp_getStallholderMasterlist(
    IN p_branch_id INT
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
        sh.contract_status,
        sh.contract_start_date,
        sh.contract_end_date,
        s.stall_id,
        s.stall_number,
        s.stall_size,
        s.rental_fee,
        sec.section_name,
        f.floor_number,
        b.branch_name
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
    AND sh.contract_status = 'Active'
    ORDER BY b.branch_name, f.floor_number, sec.section_name, s.stall_number;
END//

-- =====================================================
-- OWNER BRANCH STORED PROCEDURES
-- =====================================================

-- SP: sp_getOwnerBranches
DROP PROCEDURE IF EXISTS sp_getOwnerBranches//
CREATE PROCEDURE sp_getOwnerBranches(
    IN p_owner_id INT
)
BEGIN
    SELECT 
        b.branch_id,
        b.branch_name,
        b.branch_address,
        b.branch_image_url,
        ob.relationship_type,
        (SELECT COUNT(*) FROM stall s 
         JOIN section sec ON s.section_id = sec.section_id 
         JOIN floor f ON sec.floor_id = f.floor_id 
         WHERE f.branch_id = b.branch_id) as total_stalls,
        (SELECT COUNT(*) FROM stall s 
         JOIN section sec ON s.section_id = sec.section_id 
         JOIN floor f ON sec.floor_id = f.floor_id 
         WHERE f.branch_id = b.branch_id AND s.status = 'Occupied') as occupied_stalls
    FROM branch b
    JOIN owner_branch ob ON b.branch_id = ob.branch_id
    WHERE ob.owner_id = p_owner_id
    AND ob.status = 'active'
    ORDER BY b.branch_name;
END//

-- =====================================================
-- PENALTY/PAYMENT VIEW STORED PROCEDURES
-- =====================================================

-- SP: sp_getPenaltyPayments
DROP PROCEDURE IF EXISTS sp_getPenaltyPayments//
CREATE PROCEDURE sp_getPenaltyPayments()
BEGIN
    SELECT 
        p.payment_id,
        p.stallholder_id,
        p.amount,
        p.payment_type,
        p.payment_date,
        p.payment_status,
        p.penalty_amount,
        p.penalty_reason,
        sh.stallholder_name,
        s.stall_number
    FROM payment p
    JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    WHERE p.penalty_amount > 0 OR p.payment_type = 'penalty'
    ORDER BY p.payment_date DESC;
END//

-- SP: sp_getStallholderForPayment
DROP PROCEDURE IF EXISTS sp_getStallholderForPayment//
CREATE PROCEDURE sp_getStallholderForPayment(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.applicant_id,
        sh.stall_id,
        sh.branch_id,
        s.stall_number,
        s.rental_fee,
        b.branch_name
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id;
END//

-- SP: sp_createPayment
DROP PROCEDURE IF EXISTS sp_createPayment//
CREATE PROCEDURE sp_createPayment(
    IN p_stallholder_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_type VARCHAR(50),
    IN p_payment_method VARCHAR(50),
    IN p_payment_status VARCHAR(50),
    IN p_reference_number VARCHAR(100),
    IN p_notes TEXT,
    IN p_collected_by INT
)
BEGIN
    INSERT INTO payment (
        stallholder_id,
        amount,
        payment_type,
        payment_method,
        payment_status,
        reference_number,
        notes,
        collected_by,
        payment_date,
        created_at
    ) VALUES (
        p_stallholder_id,
        p_amount,
        p_payment_type,
        p_payment_method,
        COALESCE(p_payment_status, 'completed'),
        p_reference_number,
        p_notes,
        p_collected_by,
        NOW(),
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as payment_id;
END//

-- SP: sp_getPaymentsByStallholder
DROP PROCEDURE IF EXISTS sp_getPaymentsByStallholder//
CREATE PROCEDURE sp_getPaymentsByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_type,
        p.payment_method,
        p.payment_status,
        p.reference_number,
        p.notes,
        p.payment_date,
        p.created_at,
        c.first_name as collector_first_name,
        c.last_name as collector_last_name
    FROM payment p
    LEFT JOIN collector c ON p.collected_by = c.collector_id
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC;
END//

-- =====================================================
-- COMPLAINT STORED PROCEDURES
-- =====================================================

-- SP: sp_createComplaint
DROP PROCEDURE IF EXISTS sp_createComplaint//
CREATE PROCEDURE sp_createComplaint(
    IN p_stallholder_id INT,
    IN p_branch_id INT,
    IN p_complaint_type VARCHAR(100),
    IN p_complaint_subject VARCHAR(255),
    IN p_complaint_description TEXT,
    IN p_priority VARCHAR(50),
    IN p_image_url VARCHAR(500)
)
BEGIN
    INSERT INTO complaint (
        stallholder_id,
        branch_id,
        complaint_type,
        complaint_subject,
        complaint_description,
        priority,
        image_url,
        status,
        created_at
    ) VALUES (
        p_stallholder_id,
        p_branch_id,
        p_complaint_type,
        p_complaint_subject,
        p_complaint_description,
        COALESCE(p_priority, 'normal'),
        p_image_url,
        'pending',
        NOW()
    );
    
    SELECT LAST_INSERT_ID() as complaint_id;
END//

-- SP: sp_getComplaintsByStallholder
DROP PROCEDURE IF EXISTS sp_getComplaintsByStallholder//
CREATE PROCEDURE sp_getComplaintsByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        complaint_id,
        stallholder_id,
        branch_id,
        complaint_type,
        complaint_subject,
        complaint_description,
        priority,
        status,
        image_url,
        resolution,
        resolved_at,
        created_at
    FROM complaint
    WHERE stallholder_id = p_stallholder_id
    ORDER BY created_at DESC;
END//

-- SP: sp_getComplaintsByBranch
DROP PROCEDURE IF EXISTS sp_getComplaintsByBranch//
CREATE PROCEDURE sp_getComplaintsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        c.complaint_id,
        c.stallholder_id,
        c.branch_id,
        c.complaint_type,
        c.complaint_subject,
        c.complaint_description,
        c.priority,
        c.status,
        c.image_url,
        c.resolution,
        c.resolved_at,
        c.created_at,
        sh.stallholder_name,
        s.stall_number
    FROM complaint c
    LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    WHERE c.branch_id = p_branch_id
    ORDER BY 
        CASE c.priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
        END,
        c.created_at DESC;
END//

-- SP: sp_updateComplaintStatus
DROP PROCEDURE IF EXISTS sp_updateComplaintStatus//
CREATE PROCEDURE sp_updateComplaintStatus(
    IN p_complaint_id INT,
    IN p_status VARCHAR(50),
    IN p_resolution TEXT,
    IN p_resolved_by INT
)
BEGIN
    UPDATE complaint SET
        status = p_status,
        resolution = COALESCE(p_resolution, resolution),
        resolved_by = CASE WHEN p_status IN ('resolved', 'closed') THEN p_resolved_by ELSE resolved_by END,
        resolved_at = CASE WHEN p_status IN ('resolved', 'closed') THEN NOW() ELSE resolved_at END,
        updated_at = NOW()
    WHERE complaint_id = p_complaint_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- MOBILE USER/STALLHOLDER LOOKUP STORED PROCEDURES
-- =====================================================

-- SP: sp_getStallholderByApplicantId
DROP PROCEDURE IF EXISTS sp_getStallholderByApplicantId//
CREATE PROCEDURE sp_getStallholderByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.applicant_id,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.stall_id,
        sh.branch_id,
        sh.contract_status,
        sh.contract_start_date,
        sh.contract_end_date,
        s.stall_number,
        s.stall_size,
        s.rental_fee,
        b.branch_name,
        b.branch_address
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id;
END//

-- SP: sp_getOtherInfoByApplicantId
DROP PROCEDURE IF EXISTS sp_getOtherInfoByApplicantId//
CREATE PROCEDURE sp_getOtherInfoByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        other_information_id,
        applicant_id,
        valid_id_type,
        valid_id_number,
        tin_number,
        sss_number,
        philhealth_number,
        pagibig_number,
        emergency_contact_name,
        emergency_contact_number,
        emergency_contact_relationship,
        created_at
    FROM other_information
    WHERE applicant_id = p_applicant_id;
END//

-- SP: sp_getCredentialWithApplicant
DROP PROCEDURE IF EXISTS sp_getCredentialWithApplicant//
CREATE PROCEDURE sp_getCredentialWithApplicant(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT 
        c.credential_id,
        c.username,
        c.password_hash,
        c.applicant_id,
        a.applicant_full_name,
        a.applicant_first_name,
        a.applicant_last_name,
        a.applicant_contact_number,
        a.applicant_address
    FROM credential c
    JOIN applicant a ON c.applicant_id = a.applicant_id COLLATE utf8mb4_unicode_ci
    WHERE c.username = p_username COLLATE utf8mb4_unicode_ci;
END//

DELIMITER ;

SELECT 'Migration 405 Complete - All remaining CRUD procedures added!' as status;
