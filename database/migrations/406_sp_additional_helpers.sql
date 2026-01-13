-- =====================================================
-- MIGRATION 406: Additional Helper Stored Procedures
-- These complete the stored procedure coverage
-- =====================================================

DELIMITER //

-- SP: sp_getApplicantById
-- Used by declineApplicant and other controllers
DROP PROCEDURE IF EXISTS sp_getApplicantById//
CREATE PROCEDURE sp_getApplicantById(
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
        a.applicant_email,
        a.applied_date,
        a.created_at,
        oi.email_address,
        oi.valid_id_type,
        oi.valid_id_number
    FROM applicant a
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE a.applicant_id = p_applicant_id;
END//

-- SP: sp_getApplicantWithFullDetails
-- Returns applicant with all related information
DROP PROCEDURE IF EXISTS sp_getApplicantWithFullDetails//
CREATE PROCEDURE sp_getApplicantWithFullDetails(
    IN p_applicant_id INT
)
BEGIN
    -- Main applicant data
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
        a.applicant_email,
        a.applied_date,
        a.created_at as applicant_created_at,
        -- Other Information
        oi.email_address,
        oi.valid_id_type,
        oi.valid_id_number,
        oi.tin_number,
        oi.emergency_contact_name,
        oi.emergency_contact_number,
        -- Business Information
        bi.business_name,
        bi.nature_of_business as business_type,
        bi.business_description,
        bi.business_address,
        bi.years_in_business,
        -- Spouse Information
        sp.spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        sp.spouse_contact_number,
        sp.spouse_occupation,
        -- Application Information
        app.application_id,
        app.application_status,
        app.application_date,
        app.stall_id,
        -- Stall Information
        st.stall_number,
        st.stall_size,
        st.rental_price,
        st.status as stall_status,
        -- Section/Floor/Branch
        sec.section_name,
        f.floor_number,
        f.floor_name,
        b.branch_id,
        b.branch_name,
        b.branch_address
    FROM applicant a
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
    LEFT JOIN application app ON a.applicant_id = app.applicant_id
    LEFT JOIN stall st ON app.stall_id = st.stall_id
    LEFT JOIN section sec ON st.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.applicant_id = p_applicant_id;
END//

-- SP: sp_getStallholderFullDetails
-- Returns stallholder with stall and branch details
DROP PROCEDURE IF EXISTS sp_getStallholderFullDetails//
CREATE PROCEDURE sp_getStallholderFullDetails(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.applicant_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.contract_status,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.lease_amount,
        sh.monthly_rent,
        sh.payment_status,
        sh.compliance_status,
        sh.date_created,
        -- Stall Info
        s.stall_id,
        s.stall_number,
        s.stall_size,
        s.rental_price,
        s.status as stall_status,
        -- Section Info
        sec.section_id,
        sec.section_name,
        -- Floor Info
        f.floor_id,
        f.floor_number,
        f.floor_name,
        -- Branch Info
        b.branch_id,
        b.branch_name,
        b.branch_address,
        b.branch_contact
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.stallholder_id = p_stallholder_id;
END//

-- SP: sp_getAllApplicantsByStatus
-- Get all applicants filtered by application status
DROP PROCEDURE IF EXISTS sp_getAllApplicantsByStatus//
CREATE PROCEDURE sp_getAllApplicantsByStatus(
    IN p_status VARCHAR(50),
    IN p_branch_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        a.applicant_id,
        a.applicant_full_name,
        a.applicant_first_name,
        a.applicant_last_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applied_date,
        app.application_id,
        app.application_status,
        app.application_date,
        s.stall_number,
        b.branch_name
    FROM applicant a
    LEFT JOIN application app ON a.applicant_id = app.applicant_id
    LEFT JOIN stall s ON app.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE (p_status IS NULL OR app.application_status = p_status)
    AND (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    ORDER BY app.application_date DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- SP: sp_countApplicantsByStatus
DROP PROCEDURE IF EXISTS sp_countApplicantsByStatus//
CREATE PROCEDURE sp_countApplicantsByStatus(
    IN p_status VARCHAR(50),
    IN p_branch_id INT
)
BEGIN
    SELECT COUNT(*) as total
    FROM applicant a
    LEFT JOIN application app ON a.applicant_id = app.applicant_id
    LEFT JOIN stall s ON app.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE (p_status IS NULL OR app.application_status = p_status)
    AND (p_branch_id IS NULL OR b.branch_id = p_branch_id);
END//

-- SP: sp_getAllStallholders
DROP PROCEDURE IF EXISTS sp_getAllStallholders//
CREATE PROCEDURE sp_getAllStallholders(
    IN p_branch_id INT,
    IN p_status VARCHAR(50),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.applicant_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.business_name,
        sh.contract_status,
        sh.payment_status,
        sh.compliance_status,
        sh.date_created,
        s.stall_number,
        s.stall_size,
        b.branch_name
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
    AND (p_status IS NULL OR sh.contract_status = p_status)
    ORDER BY sh.date_created DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- SP: sp_searchStallholders
DROP PROCEDURE IF EXISTS sp_searchStallholders//
CREATE PROCEDURE sp_searchStallholders(
    IN p_search_term VARCHAR(255),
    IN p_branch_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.business_name,
        sh.contract_status,
        s.stall_number,
        b.branch_name
    FROM stallholder sh
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
    AND (
        sh.stallholder_name LIKE CONCAT('%', p_search_term, '%')
        OR sh.business_name LIKE CONCAT('%', p_search_term, '%')
        OR sh.email LIKE CONCAT('%', p_search_term, '%')
        OR sh.contact_number LIKE CONCAT('%', p_search_term, '%')
        OR s.stall_number LIKE CONCAT('%', p_search_term, '%')
    )
    ORDER BY sh.stallholder_name
    LIMIT 50;
END//

-- SP: sp_getInspectorById
DROP PROCEDURE IF EXISTS sp_getInspectorById//
CREATE PROCEDURE sp_getInspectorById(
    IN p_inspector_id INT
)
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        i.created_at,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.inspector_id = p_inspector_id;
END//

-- SP: sp_getCollectorById
DROP PROCEDURE IF EXISTS sp_getCollectorById//
CREATE PROCEDURE sp_getCollectorById(
    IN p_collector_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.last_login,
        c.date_created,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.collector_id = p_collector_id;
END//

-- SP: sp_getDashboardStats
-- Get statistics for admin dashboard
DROP PROCEDURE IF EXISTS sp_getDashboardStats//
CREATE PROCEDURE sp_getDashboardStats(
    IN p_branch_id INT
)
BEGIN
    -- Total applicants (pending)
    SELECT 
        (SELECT COUNT(*) FROM application WHERE application_status = 'Pending' 
         AND (p_branch_id IS NULL OR stall_id IN (
             SELECT s.stall_id FROM stall s 
             JOIN section sec ON s.section_id = sec.section_id 
             JOIN floor f ON sec.floor_id = f.floor_id 
             WHERE f.branch_id = p_branch_id
         ))) as pending_applications,
        
        (SELECT COUNT(*) FROM stallholder WHERE contract_status = 'Active'
         AND (p_branch_id IS NULL OR branch_id = p_branch_id)) as active_stallholders,
        
        (SELECT COUNT(*) FROM stall WHERE status = 'Available'
         AND (p_branch_id IS NULL OR section_id IN (
             SELECT sec.section_id FROM section sec 
             JOIN floor f ON sec.floor_id = f.floor_id 
             WHERE f.branch_id = p_branch_id
         ))) as available_stalls,
        
        (SELECT COUNT(*) FROM stall WHERE status = 'Occupied'
         AND (p_branch_id IS NULL OR section_id IN (
             SELECT sec.section_id FROM section sec 
             JOIN floor f ON sec.floor_id = f.floor_id 
             WHERE f.branch_id = p_branch_id
         ))) as occupied_stalls,
        
        (SELECT COUNT(*) FROM complaint WHERE status = 'pending'
         AND (p_branch_id IS NULL OR branch_id = p_branch_id)) as pending_complaints,
        
        (SELECT COUNT(*) FROM inspector WHERE status = 'active') as active_inspectors,
        
        (SELECT COUNT(*) FROM collector WHERE status = 'active') as active_collectors,
        
        (SELECT COALESCE(SUM(amount), 0) FROM payments 
         WHERE payment_status = 'completed' 
         AND MONTH(payment_date) = MONTH(CURRENT_DATE())
         AND YEAR(payment_date) = YEAR(CURRENT_DATE())
         AND (p_branch_id IS NULL OR branch_id = p_branch_id)) as monthly_revenue;
END//

DELIMITER ;

SELECT 'Migration 406 Complete - Additional Helper SPs added!' as status;
