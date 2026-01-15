-- =====================================================
-- RECREATION OF STORED PROCEDURES
-- All procedures now return plain text data directly
-- since we've permanently decrypted the database
-- =====================================================

-- Drop existing procedures first
DROP PROCEDURE IF EXISTS sp_getAllStallholdersAll;
DROP PROCEDURE IF EXISTS sp_getAllStallholdersAllDecrypted;
DROP PROCEDURE IF EXISTS sp_getAllStallholdersByBranches;
DROP PROCEDURE IF EXISTS sp_getAllStallholdersByBranchesDecrypted;
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeesAll;
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeesAllDecrypted;
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeesByBranch;
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeesByBranchDecrypted;
DROP PROCEDURE IF EXISTS sp_getOnsitePayments;
DROP PROCEDURE IF EXISTS sp_getOnsitePaymentsDecrypted;
DROP PROCEDURE IF EXISTS sp_getOnlinePayments;
DROP PROCEDURE IF EXISTS sp_getOnlinePaymentsDecrypted;
DROP PROCEDURE IF EXISTS sp_getInspectorsForMobile;
DROP PROCEDURE IF EXISTS sp_getInspectorsForMobileDecrypted;
DROP PROCEDURE IF EXISTS sp_getCollectorsForMobile;
DROP PROCEDURE IF EXISTS sp_getCollectorsForMobileDecrypted;
DROP PROCEDURE IF EXISTS getAllComplaintsDecrypted;
DROP PROCEDURE IF EXISTS getAllComplianceRecordsDecrypted;
DROP PROCEDURE IF EXISTS sp_getAllStalls_complete_decrypted;
DROP PROCEDURE IF EXISTS sp_getAllApplicantsDecrypted;

DELIMITER $$

-- =====================================
-- STALLHOLDER PROCEDURES
-- =====================================

CREATE PROCEDURE sp_getAllStallholdersAll()
BEGIN
    SELECT 
        s.stallholder_id,
        s.stallholder_name,
        s.email,
        s.contact_number,
        s.address,
        s.profile_picture,
        s.is_verified,
        s.is_active,
        s.date_registered,
        b.branch_id,
        b.branch_name,
        st.stall_id,
        st.stall_number,
        st.status AS stall_status
    FROM stallholder s
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN branch b ON st.branch_id = b.branch_id
    ORDER BY s.stallholder_id DESC;
END$$

CREATE PROCEDURE sp_getAllStallholdersAllDecrypted()
BEGIN
    CALL sp_getAllStallholdersAll();
END$$

CREATE PROCEDURE sp_getAllStallholdersByBranches(IN branchIds VARCHAR(255))
BEGIN
    SET @sql = CONCAT('
        SELECT 
            s.stallholder_id,
            s.stallholder_name,
            s.email,
            s.contact_number,
            s.address,
            s.profile_picture,
            s.is_verified,
            s.is_active,
            s.date_registered,
            b.branch_id,
            b.branch_name,
            st.stall_id,
            st.stall_number,
            st.status AS stall_status
        FROM stallholder s
        LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
        LEFT JOIN branch b ON st.branch_id = b.branch_id
        WHERE b.branch_id IN (', branchIds, ')
        ORDER BY s.stallholder_id DESC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

CREATE PROCEDURE sp_getAllStallholdersByBranchesDecrypted(IN branchIds VARCHAR(255))
BEGIN
    CALL sp_getAllStallholdersByBranches(branchIds);
END$$

-- =====================================
-- EMPLOYEE PROCEDURES
-- =====================================

CREATE PROCEDURE sp_getBusinessEmployeesAll()
BEGIN
    SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone_number AS contact_number,
        e.role,
        e.is_active,
        e.profile_picture,
        e.created_at,
        b.branch_id,
        b.branch_name
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id
    ORDER BY e.employee_id DESC;
END$$

CREATE PROCEDURE sp_getBusinessEmployeesAllDecrypted()
BEGIN
    CALL sp_getBusinessEmployeesAll();
END$$

CREATE PROCEDURE sp_getBusinessEmployeesByBranch(IN branchId INT)
BEGIN
    SELECT 
        e.employee_id,
        e.first_name,
        e.last_name,
        e.email,
        e.phone_number AS contact_number,
        e.role,
        e.is_active,
        e.profile_picture,
        e.created_at,
        b.branch_id,
        b.branch_name
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id
    WHERE e.branch_id = branchId
    ORDER BY e.employee_id DESC;
END$$

CREATE PROCEDURE sp_getBusinessEmployeesByBranchDecrypted(IN branchId INT)
BEGIN
    CALL sp_getBusinessEmployeesByBranch(branchId);
END$$

-- =====================================
-- PAYMENT PROCEDURES
-- =====================================

CREATE PROCEDURE sp_getOnsitePayments()
BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.status,
        p.reference_number,
        p.proof_of_payment,
        s.stallholder_id,
        s.stallholder_name,
        s.email,
        st.stall_id,
        st.stall_number,
        b.branch_id,
        b.branch_name
    FROM payments p
    LEFT JOIN stallholder s ON p.stallholder_id = s.stallholder_id
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN branch b ON st.branch_id = b.branch_id
    WHERE p.payment_method != 'online'
    ORDER BY p.payment_date DESC;
END$$

CREATE PROCEDURE sp_getOnsitePaymentsDecrypted()
BEGIN
    CALL sp_getOnsitePayments();
END$$

CREATE PROCEDURE sp_getOnlinePayments()
BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_method,
        p.status,
        p.reference_number,
        p.proof_of_payment,
        s.stallholder_id,
        s.stallholder_name,
        s.email,
        st.stall_id,
        st.stall_number,
        b.branch_id,
        b.branch_name
    FROM payments p
    LEFT JOIN stallholder s ON p.stallholder_id = s.stallholder_id
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN branch b ON st.branch_id = b.branch_id
    WHERE p.payment_method = 'online'
    ORDER BY p.payment_date DESC;
END$$

CREATE PROCEDURE sp_getOnlinePaymentsDecrypted()
BEGIN
    CALL sp_getOnlinePayments();
END$$

-- =====================================
-- MOBILE STAFF PROCEDURES
-- =====================================

CREATE PROCEDURE sp_getInspectorsForMobile()
BEGIN
    SELECT 
        i.inspector_id,
        i.first_name,
        i.last_name,
        i.email,
        i.phone_number AS contact_number,
        i.is_active,
        i.profile_picture,
        i.created_at,
        b.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN branch b ON i.branch_id = b.branch_id
    WHERE i.is_active = 1
    ORDER BY i.inspector_id DESC;
END$$

CREATE PROCEDURE sp_getInspectorsForMobileDecrypted()
BEGIN
    CALL sp_getInspectorsForMobile();
END$$

CREATE PROCEDURE sp_getCollectorsForMobile()
BEGIN
    SELECT 
        c.collector_id,
        c.first_name,
        c.last_name,
        c.email,
        c.phone_number AS contact_number,
        c.is_active,
        c.profile_picture,
        c.created_at,
        b.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN branch b ON c.branch_id = b.branch_id
    WHERE c.is_active = 1
    ORDER BY c.collector_id DESC;
END$$

CREATE PROCEDURE sp_getCollectorsForMobileDecrypted()
BEGIN
    CALL sp_getCollectorsForMobile();
END$$

-- =====================================
-- COMPLAINT PROCEDURES
-- =====================================

CREATE PROCEDURE getAllComplaintsDecrypted()
BEGIN
    SELECT 
        c.complaint_id,
        c.subject,
        c.description,
        c.status,
        c.priority,
        c.created_at,
        c.resolved_at,
        c.resolution_notes,
        s.stallholder_id,
        s.stallholder_name,
        s.email,
        st.stall_id,
        st.stall_number,
        b.branch_id,
        b.branch_name
    FROM complaint c
    LEFT JOIN stallholder s ON c.stallholder_id = s.stallholder_id
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN branch b ON st.branch_id = b.branch_id
    ORDER BY c.created_at DESC;
END$$

-- =====================================
-- COMPLIANCE PROCEDURES
-- =====================================

CREATE PROCEDURE getAllComplianceRecordsDecrypted()
BEGIN
    SELECT 
        cr.compliance_id,
        cr.compliance_type,
        cr.status,
        cr.due_date,
        cr.submitted_date,
        cr.document_path,
        cr.notes,
        s.stallholder_id,
        s.stallholder_name,
        s.email,
        st.stall_id,
        st.stall_number,
        b.branch_id,
        b.branch_name
    FROM compliance_record cr
    LEFT JOIN stallholder s ON cr.stallholder_id = s.stallholder_id
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN branch b ON st.branch_id = b.branch_id
    ORDER BY cr.due_date DESC;
END$$

-- =====================================
-- STALL PROCEDURES
-- =====================================

CREATE PROCEDURE sp_getAllStalls_complete_decrypted()
BEGIN
    SELECT 
        st.stall_id,
        st.stall_number,
        st.status,
        st.monthly_rental,
        st.size,
        st.description,
        st.stall_image,
        s.stallholder_id,
        s.stallholder_name,
        s.email,
        s.contact_number,
        b.branch_id,
        b.branch_name
    FROM stall st
    LEFT JOIN stallholder s ON st.stallholder_id = s.stallholder_id
    LEFT JOIN branch b ON st.branch_id = b.branch_id
    ORDER BY st.stall_id DESC;
END$$

-- =====================================
-- APPLICANT PROCEDURES
-- =====================================

CREATE PROCEDURE sp_getAllApplicantsDecrypted()
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_email,
        a.applicant_address,
        a.application_status,
        a.application_date,
        a.business_type,
        a.preferred_stall_id,
        st.stall_number,
        b.branch_id,
        b.branch_name
    FROM applicant a
    LEFT JOIN stall st ON a.preferred_stall_id = st.stall_id
    LEFT JOIN branch b ON st.branch_id = b.branch_id
    ORDER BY a.application_date DESC;
END$$

DELIMITER ;

-- =====================================
-- VERIFICATION
-- =====================================
SELECT 'All stored procedures recreated successfully!' AS status;
