-- =====================================================
-- MIGRATION: Convert All Raw SQL to Stored Procedures
-- Part 1: Authentication and User Management
-- =====================================================

DELIMITER //

-- =====================================================
-- AUTHENTICATION STORED PROCEDURES
-- =====================================================

-- SP: sp_getMobileUserByUsername
DROP PROCEDURE IF EXISTS sp_getMobileUserByUsername//
CREATE PROCEDURE sp_getMobileUserByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        c.registrationid,
        c.user_name,
        c.password_hash,
        a.applicant_id,
        CONCAT(a.applicant_first_name, ' ', IFNULL(a.applicant_middle_name, ''), ' ', a.applicant_last_name) AS applicant_full_name,
        a.applicant_contact_number,
        o.email_address AS applicant_email
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_info o ON a.applicant_id = o.applicant_id
    WHERE c.user_name COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
    LIMIT 1;
END//

-- SP: sp_getSpouseByApplicantId
DROP PROCEDURE IF EXISTS sp_getSpouseByApplicantId//
CREATE PROCEDURE sp_getSpouseByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM spouse WHERE applicant_id = p_applicant_id;
END//

-- SP: sp_getBusinessInfoByApplicantId
DROP PROCEDURE IF EXISTS sp_getBusinessInfoByApplicantId//
CREATE PROCEDURE sp_getBusinessInfoByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM business_info WHERE applicant_id = p_applicant_id;
END//

-- SP: sp_getOtherInfoByApplicantId
DROP PROCEDURE IF EXISTS sp_getOtherInfoByApplicantId//
CREATE PROCEDURE sp_getOtherInfoByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM other_info WHERE applicant_id = p_applicant_id;
END//

-- SP: sp_getLatestApplicationByApplicantId
DROP PROCEDURE IF EXISTS sp_getLatestApplicationByApplicantId//
CREATE PROCEDURE sp_getLatestApplicationByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT a.*, s.stall_number, s.stall_name, b.branch_name 
    FROM application a 
    LEFT JOIN stall s ON a.stall_id = s.stall_id 
    LEFT JOIN branch b ON s.branch_id = b.branch_id 
    WHERE a.applicant_id = p_applicant_id 
    ORDER BY a.created_at DESC LIMIT 1;
END//

-- SP: sp_getStallholderByApplicantId
DROP PROCEDURE IF EXISTS sp_getStallholderByApplicantId//
CREATE PROCEDURE sp_getStallholderByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM stallholder WHERE applicant_id = p_applicant_id;
END//

-- SP: sp_getApplicantById
DROP PROCEDURE IF EXISTS sp_getApplicantById//
CREATE PROCEDURE sp_getApplicantById(
    IN p_applicant_id INT
)
BEGIN
    SELECT a.*, c.user_name, c.applicant_email 
    FROM applicant a 
    LEFT JOIN credential c ON a.applicant_id = c.applicant_id 
    WHERE a.applicant_id = p_applicant_id;
END//

-- SP: sp_updateCredentialLastLogout
DROP PROCEDURE IF EXISTS sp_updateCredentialLastLogout//
CREATE PROCEDURE sp_updateCredentialLastLogout(
    IN p_applicant_id INT,
    IN p_logout_time VARCHAR(50)
)
BEGIN
    UPDATE credential 
    SET last_logout = p_logout_time 
    WHERE applicant_id = p_applicant_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- STAFF LOGIN STORED PROCEDURES
-- =====================================================

-- SP: sp_getInspectorByUsername
DROP PROCEDURE IF EXISTS sp_getInspectorByUsername//
CREATE PROCEDURE sp_getInspectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.email,
        i.password as password_hash,
        i.contact_no,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status COLLATE utf8mb4_general_ci = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci 
      AND i.status COLLATE utf8mb4_general_ci = 'active'
    LIMIT 1;
END//

-- SP: sp_getCollectorByUsername
DROP PROCEDURE IF EXISTS sp_getCollectorByUsername//
CREATE PROCEDURE sp_getCollectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.email,
        c.password_hash,
        c.contact_no,
        c.status,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci 
      AND c.status COLLATE utf8mb4_general_ci = 'active'
    LIMIT 1;
END//

-- SP: sp_updateInspectorLastLogin
DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogin//
CREATE PROCEDURE sp_updateInspectorLastLogin(
    IN p_inspector_id INT
)
BEGIN
    UPDATE inspector SET last_login = NOW() WHERE inspector_id = p_inspector_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_updateCollectorLastLogin
DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogin//
CREATE PROCEDURE sp_updateCollectorLastLogin(
    IN p_collector_id INT
)
BEGIN
    UPDATE collector SET last_login = NOW() WHERE collector_id = p_collector_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_updateInspectorLastLogout
DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogout//
CREATE PROCEDURE sp_updateInspectorLastLogout(
    IN p_inspector_id INT
)
BEGIN
    UPDATE inspector SET last_logout = NOW() WHERE inspector_id = p_inspector_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_updateCollectorLastLogout
DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogout//
CREATE PROCEDURE sp_updateCollectorLastLogout(
    IN p_collector_id INT
)
BEGIN
    UPDATE collector SET last_logout = NOW() WHERE collector_id = p_collector_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_deactivateStaffSessions
DROP PROCEDURE IF EXISTS sp_deactivateStaffSessions//
CREATE PROCEDURE sp_deactivateStaffSessions(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(50)
)
BEGIN
    UPDATE staff_session SET is_active = 0 WHERE staff_id = p_staff_id AND staff_type = p_staff_type;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_createStaffSession
DROP PROCEDURE IF EXISTS sp_createStaffSession//
CREATE PROCEDURE sp_createStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(50),
    IN p_session_token TEXT,
    IN p_ip_address VARCHAR(100),
    IN p_user_agent VARCHAR(500)
)
BEGIN
    INSERT INTO staff_session (staff_id, staff_type, session_token, ip_address, user_agent, login_time, last_activity, is_active) 
    VALUES (p_staff_id, p_staff_type, p_session_token, p_ip_address, p_user_agent, NOW(), NOW(), 1);
    
    SELECT LAST_INSERT_ID() as session_id;
END//

-- SP: sp_createStaffSessionMinimal
DROP PROCEDURE IF EXISTS sp_createStaffSessionMinimal//
CREATE PROCEDURE sp_createStaffSessionMinimal(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(50)
)
BEGIN
    INSERT INTO staff_session (staff_id, staff_type, is_active, login_time, last_activity) 
    VALUES (p_staff_id, p_staff_type, 1, NOW(), NOW());
    
    SELECT LAST_INSERT_ID() as session_id;
END//

-- SP: sp_endStaffSession
DROP PROCEDURE IF EXISTS sp_endStaffSession//
CREATE PROCEDURE sp_endStaffSession(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(50)
)
BEGIN
    UPDATE staff_session 
    SET is_active = 0, logout_time = NOW(), last_activity = NOW() 
    WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_updateStaffSessionActivity
DROP PROCEDURE IF EXISTS sp_updateStaffSessionActivity//
CREATE PROCEDURE sp_updateStaffSessionActivity(
    IN p_staff_id INT,
    IN p_staff_type VARCHAR(50)
)
BEGIN
    UPDATE staff_session SET last_activity = NOW() WHERE staff_id = p_staff_id AND staff_type = p_staff_type AND is_active = 1;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_getInspectorName
DROP PROCEDURE IF EXISTS sp_getInspectorName//
CREATE PROCEDURE sp_getInspectorName(
    IN p_inspector_id INT
)
BEGIN
    SELECT first_name, last_name FROM inspector WHERE inspector_id = p_inspector_id;
END//

-- SP: sp_getCollectorName
DROP PROCEDURE IF EXISTS sp_getCollectorName//
CREATE PROCEDURE sp_getCollectorName(
    IN p_collector_id INT
)
BEGIN
    SELECT first_name, last_name FROM collector WHERE collector_id = p_collector_id;
END//

-- SP: sp_logStaffActivity
DROP PROCEDURE IF EXISTS sp_logStaffActivity//
CREATE PROCEDURE sp_logStaffActivity(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_action_type VARCHAR(100),
    IN p_action_description TEXT,
    IN p_module VARCHAR(100),
    IN p_ip_address VARCHAR(100),
    IN p_user_agent VARCHAR(500),
    IN p_status VARCHAR(50),
    IN p_timestamp VARCHAR(50)
)
BEGIN
    INSERT INTO staff_activity_log (
        staff_type, staff_id, staff_name, branch_id, action_type, 
        action_description, module, ip_address, user_agent, status, created_at
    ) VALUES (
        p_staff_type, p_staff_id, p_staff_name, p_branch_id, p_action_type,
        p_action_description, p_module, p_ip_address, p_user_agent, p_status, p_timestamp
    );
    
    SELECT LAST_INSERT_ID() as log_id;
END//

-- SP: sp_autoLogoutInspector
DROP PROCEDURE IF EXISTS sp_autoLogoutInspector//
CREATE PROCEDURE sp_autoLogoutInspector(
    IN p_inspector_id INT,
    IN p_logout_time VARCHAR(50),
    IN p_ip_address VARCHAR(100),
    IN p_user_agent VARCHAR(500)
)
BEGIN
    UPDATE inspector SET last_logout = p_logout_time WHERE inspector_id = p_inspector_id;
    UPDATE staff_session SET is_active = 0, logout_time = p_logout_time, last_activity = p_logout_time 
    WHERE staff_id = p_inspector_id AND staff_type = 'inspector' AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_autoLogoutCollector
DROP PROCEDURE IF EXISTS sp_autoLogoutCollector//
CREATE PROCEDURE sp_autoLogoutCollector(
    IN p_collector_id INT,
    IN p_logout_time VARCHAR(50),
    IN p_ip_address VARCHAR(100),
    IN p_user_agent VARCHAR(500)
)
BEGIN
    UPDATE collector SET last_logout = p_logout_time WHERE collector_id = p_collector_id;
    UPDATE staff_session SET is_active = 0, logout_time = p_logout_time, last_activity = p_logout_time 
    WHERE staff_id = p_collector_id AND staff_type = 'collector' AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- CURRENT USER STORED PROCEDURES
-- =====================================================

-- SP: sp_getAdminById
DROP PROCEDURE IF EXISTS sp_getAdminById//
CREATE PROCEDURE sp_getAdminById(
    IN p_admin_id INT
)
BEGIN
    SELECT admin_id, admin_username, email, first_name, last_name, contact_number, status, created_at 
    FROM admin WHERE admin_id = p_admin_id;
END//

-- SP: sp_getBranchManagerById
DROP PROCEDURE IF EXISTS sp_getBranchManagerById//
CREATE PROCEDURE sp_getBranchManagerById(
    IN p_manager_id INT
)
BEGIN
    SELECT 
        bm.branch_manager_id,
        bm.branch_id,
        bm.first_name,
        bm.last_name,
        bm.manager_username,
        bm.email,
        bm.contact_number,
        bm.status,
        bm.created_at,
        bm.updated_at,
        b.branch_name,
        b.area,
        b.location,
        b.address as branch_address,
        b.contact_number as branch_contact,
        b.email as branch_email
    FROM branch_manager bm
    LEFT JOIN branch b ON bm.branch_id = b.branch_id
    WHERE bm.branch_manager_id = p_manager_id;
END//

-- SP: sp_getBranchManagerForCurrentUser
DROP PROCEDURE IF EXISTS sp_getBranchManagerForCurrentUser//
CREATE PROCEDURE sp_getBranchManagerForCurrentUser(
    IN p_manager_id INT
)
BEGIN
    SELECT 
        bm.branch_manager_id,
        bm.manager_username,
        bm.first_name,
        bm.last_name,
        bm.email,
        bm.contact_number,
        bm.status,
        bm.created_at,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM branch_manager bm
    INNER JOIN branch b ON bm.branch_id = b.branch_id
    WHERE bm.branch_manager_id = p_manager_id;
END//

-- =====================================================
-- BRANCH MANAGER CRUD STORED PROCEDURES
-- =====================================================

-- SP: sp_createBranchManager
DROP PROCEDURE IF EXISTS sp_createBranchManager//
CREATE PROCEDURE sp_createBranchManager(
    IN p_branch_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_username VARCHAR(100),
    IN p_password_hash VARCHAR(255),
    IN p_email VARCHAR(255),
    IN p_contact_number VARCHAR(50),
    IN p_address VARCHAR(500),
    IN p_status VARCHAR(50)
)
BEGIN
    INSERT INTO branch_manager (
        branch_id, first_name, last_name, manager_username, manager_password_hash, 
        email, contact_number, address, status, created_at
    ) VALUES (
        p_branch_id, p_first_name, p_last_name, p_username, p_password_hash,
        p_email, p_contact_number, p_address, COALESCE(p_status, 'active'), NOW()
    );
    
    SELECT LAST_INSERT_ID() as branch_manager_id;
END//

-- SP: sp_deleteBranchManager
DROP PROCEDURE IF EXISTS sp_deleteBranchManager//
CREATE PROCEDURE sp_deleteBranchManager(
    IN p_manager_id INT
)
BEGIN
    DELETE FROM branch_manager WHERE branch_manager_id = p_manager_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- SP: sp_getAllBranchManagers
DROP PROCEDURE IF EXISTS sp_getAllBranchManagers//
CREATE PROCEDURE sp_getAllBranchManagers()
BEGIN
    SELECT 
        bm.branch_manager_id,
        bm.branch_id,
        bm.first_name,
        bm.last_name,
        bm.manager_username,
        bm.email,
        bm.contact_number,
        bm.address,
        bm.status,
        bm.created_at,
        bm.updated_at,
        b.branch_name,
        b.area,
        b.location,
        b.address as branch_address,
        b.contact_number as branch_contact,
        b.email as branch_email
    FROM branch_manager bm
    LEFT JOIN branch b ON bm.branch_id = b.branch_id
    ORDER BY bm.created_at DESC;
END//

-- =====================================================
-- AREA & BRANCH STORED PROCEDURES
-- =====================================================

-- SP: sp_getAreaById
DROP PROCEDURE IF EXISTS sp_getAreaById//
CREATE PROCEDURE sp_getAreaById(
    IN p_area_id INT
)
BEGIN
    SELECT * FROM area WHERE area_id = p_area_id;
END//

-- SP: sp_getAreasByCity
DROP PROCEDURE IF EXISTS sp_getAreasByCity//
CREATE PROCEDURE sp_getAreasByCity(
    IN p_city_name VARCHAR(255)
)
BEGIN
    SELECT * FROM area WHERE city = p_city_name ORDER BY area_name;
END//

-- SP: sp_getBranchByArea
DROP PROCEDURE IF EXISTS sp_getBranchByArea//
CREATE PROCEDURE sp_getBranchByArea(
    IN p_area VARCHAR(255)
)
BEGIN
    SELECT * FROM branch WHERE area = p_area ORDER BY branch_name;
END//

-- SP: sp_getBranchesByAreaId
DROP PROCEDURE IF EXISTS sp_getBranchesByAreaId//
CREATE PROCEDURE sp_getBranchesByAreaId(
    IN p_area_id INT
)
BEGIN
    SELECT * FROM branch WHERE area_id = p_area_id ORDER BY branch_name;
END//

-- =====================================================
-- COMPLAINT STORED PROCEDURES
-- =====================================================

-- SP: sp_getStallholderByApplicantIdSimple
DROP PROCEDURE IF EXISTS sp_getStallholderByApplicantIdSimple//
CREATE PROCEDURE sp_getStallholderByApplicantIdSimple(
    IN p_applicant_id INT
)
BEGIN
    SELECT stallholder_id FROM stallholder WHERE applicant_id = p_applicant_id LIMIT 1;
END//

-- SP: sp_getStallByStallholder
DROP PROCEDURE IF EXISTS sp_getStallByStallholder//
CREATE PROCEDURE sp_getStallByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT stall_id, branch_id FROM stall WHERE stallholder_id = p_stallholder_id LIMIT 1;
END//

-- SP: sp_createComplaint
DROP PROCEDURE IF EXISTS sp_createComplaint//
CREATE PROCEDURE sp_createComplaint(
    IN p_complaint_type VARCHAR(100),
    IN p_sender_name VARCHAR(255),
    IN p_sender_contact VARCHAR(50),
    IN p_sender_email VARCHAR(255),
    IN p_stallholder_id INT,
    IN p_stall_id INT,
    IN p_branch_id INT,
    IN p_subject VARCHAR(255),
    IN p_description TEXT,
    IN p_evidence TEXT,
    IN p_priority VARCHAR(20)
)
BEGIN
    INSERT INTO complaint (
        complaint_type, sender_name, sender_contact, sender_email,
        stallholder_id, stall_id, branch_id, subject, description,
        evidence, priority, status, created_at
    ) VALUES (
        p_complaint_type, p_sender_name, p_sender_contact, p_sender_email,
        p_stallholder_id, p_stall_id, p_branch_id, p_subject, p_description,
        p_evidence, COALESCE(p_priority, 'medium'), 'pending', NOW()
    );
    
    SELECT LAST_INSERT_ID() as complaint_id;
END//

-- SP: sp_getComplaintsByStallholder
DROP PROCEDURE IF EXISTS sp_getComplaintsByStallholder//
CREATE PROCEDURE sp_getComplaintsByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT complaint_id, complaint_type, subject, description, evidence, priority, status, created_at
    FROM complaint 
    WHERE stallholder_id = p_stallholder_id 
    ORDER BY created_at DESC;
END//

-- =====================================================
-- PAYMENT STORED PROCEDURES
-- =====================================================

-- SP: sp_getPaymentsByStallholderPaginated
DROP PROCEDURE IF EXISTS sp_getPaymentsByStallholderPaginated//
CREATE PROCEDURE sp_getPaymentsByStallholderPaginated(
    IN p_stallholder_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.stallholder_id,
        p.payment_method,
        p.amount,
        p.payment_date,
        p.status,
        p.reference_number,
        p.branch_id,
        b.branch_name
    FROM payments p
    LEFT JOIN branch b ON p.branch_id = b.branch_id
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- SP: sp_getPaymentCountByStallholder
DROP PROCEDURE IF EXISTS sp_getPaymentCountByStallholder//
CREATE PROCEDURE sp_getPaymentCountByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT COUNT(*) as total FROM payments WHERE stallholder_id = p_stallholder_id;
END//

-- SP: sp_getAllPaymentsByStallholder
DROP PROCEDURE IF EXISTS sp_getAllPaymentsByStallholder//
CREATE PROCEDURE sp_getAllPaymentsByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.stallholder_id,
        p.payment_method,
        p.amount,
        p.payment_date,
        p.status,
        p.reference_number,
        p.branch_id,
        b.branch_name
    FROM payments p
    LEFT JOIN branch b ON p.branch_id = b.branch_id
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC;
END//

-- SP: sp_getPaymentSummaryByStallholder
DROP PROCEDURE IF EXISTS sp_getPaymentSummaryByStallholder//
CREATE PROCEDURE sp_getPaymentSummaryByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(amount), 0) as total_amount,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as paid_amount,
        COALESCE(SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END), 0) as pending_amount
    FROM payments 
    WHERE stallholder_id = p_stallholder_id;
END//

-- =====================================================
-- CREDENTIALS STORED PROCEDURES
-- =====================================================

-- SP: sp_getCredentialByApplicantId
DROP PROCEDURE IF EXISTS sp_getCredentialByApplicantId//
CREATE PROCEDURE sp_getCredentialByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT * FROM credential WHERE applicant_id = p_applicant_id LIMIT 1;
END//

-- SP: sp_checkCredentialExists
DROP PROCEDURE IF EXISTS sp_checkCredentialExists//
CREATE PROCEDURE sp_checkCredentialExists(
    IN p_applicant_id INT
)
BEGIN
    SELECT registrationid FROM credential WHERE applicant_id = p_applicant_id LIMIT 1;
END//

-- SP: sp_createCredential
DROP PROCEDURE IF EXISTS sp_createCredential//
CREATE PROCEDURE sp_createCredential(
    IN p_applicant_id INT,
    IN p_username VARCHAR(100),
    IN p_password_hash VARCHAR(255)
)
BEGIN
    INSERT INTO credential (applicant_id, user_name, password_hash, created_date, is_active)
    VALUES (p_applicant_id, p_username, p_password_hash, NOW(), 1);
    
    SELECT LAST_INSERT_ID() as registrationid;
END//

DELIMITER ;

-- Create staff_activity_log table if not exists
CREATE TABLE IF NOT EXISTS staff_activity_log (
    log_id INT NOT NULL AUTO_INCREMENT,
    staff_type VARCHAR(50) NOT NULL,
    staff_id INT NOT NULL,
    staff_name VARCHAR(255),
    branch_id INT,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    module VARCHAR(100) DEFAULT 'mobile_app',
    ip_address VARCHAR(100),
    user_agent VARCHAR(500),
    status VARCHAR(50) DEFAULT 'success',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (log_id),
    KEY idx_staff_activity_staff (staff_id, staff_type),
    KEY idx_staff_activity_date (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT 'Part 1 Migration Complete - Authentication & User Management SPs created!' as status;
