-- =====================================================
-- MIGRATION 407: Payment and Mobile Helper Stored Procedures
-- =====================================================

DELIMITER //

-- SP: sp_getStallholderIdByApplicant
-- Used to look up stallholder_id from applicant_id
DROP PROCEDURE IF EXISTS sp_getStallholderIdByApplicant//
CREATE PROCEDURE sp_getStallholderIdByApplicant(
    IN p_applicant_id INT
)
BEGIN
    SELECT stallholder_id 
    FROM stallholder 
    WHERE applicant_id = p_applicant_id 
    LIMIT 1;
END//

-- SP: sp_getPaymentCountByStallholder
DROP PROCEDURE IF EXISTS sp_getPaymentCountByStallholder//
CREATE PROCEDURE sp_getPaymentCountByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT COUNT(*) as total 
    FROM payments 
    WHERE stallholder_id = p_stallholder_id;
END//

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
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.reference_number,
        p.collected_by,
        p.payment_status,
        p.notes,
        p.branch_id,
        p.created_at,
        b.branch_name
    FROM payments p
    LEFT JOIN branch b ON p.branch_id = b.branch_id
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC, p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- SP: sp_getAllPaymentsByStallholder (no pagination)
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
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.reference_number,
        p.collected_by,
        p.payment_status,
        p.notes,
        p.branch_id,
        p.created_at,
        b.branch_name
    FROM payments p
    LEFT JOIN branch b ON p.branch_id = b.branch_id
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC, p.created_at DESC;
END//

-- SP: sp_getPaymentSummaryByStallholder
DROP PROCEDURE IF EXISTS sp_getPaymentSummaryByStallholder//
CREATE PROCEDURE sp_getPaymentSummaryByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        COUNT(*) as total_payments,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount ELSE 0 END), 0) as total_paid,
        COALESCE(SUM(CASE WHEN payment_status = 'pending' THEN amount ELSE 0 END), 0) as total_pending,
        MAX(payment_date) as last_payment_date
    FROM payments 
    WHERE stallholder_id = p_stallholder_id;
END//

-- SP: sp_getMobileUserByUsername (if not exists)
DROP PROCEDURE IF EXISTS sp_getMobileUserByUsername//
CREATE PROCEDURE sp_getMobileUserByUsername(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT 
        c.registrationid,
        c.user_name,
        c.password_hash,
        c.applicant_id,
        c.is_active,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_email,
        o.email_address AS applicant_email_alt
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_info o ON a.applicant_id = o.applicant_id
    WHERE c.user_name COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
    AND c.is_active = 1
    LIMIT 1;
END//

-- SP: sp_getCredentialWithApplicant
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
        c.is_active,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        a.applicant_email
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    WHERE c.user_name COLLATE utf8mb4_general_ci = p_username COLLATE utf8mb4_general_ci
      AND c.is_active = 1
    LIMIT 1;
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

-- SP: sp_getLatestApplicationByApplicantId
DROP PROCEDURE IF EXISTS sp_getLatestApplicationByApplicantId//
CREATE PROCEDURE sp_getLatestApplicationByApplicantId(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        a.*,
        s.stall_no,
        s.stall_location,
        s.size,
        s.rental_price,
        b.branch_id,
        b.branch_name
    FROM application a 
    LEFT JOIN stall s ON a.stall_id = s.stall_id 
    LEFT JOIN branch b ON s.branch_id = b.branch_id 
    WHERE a.applicant_id = p_applicant_id 
    ORDER BY a.created_at DESC 
    LIMIT 1;
END//

DELIMITER ;

SELECT 'Migration 407 Complete - Payment & Mobile Helper SPs added!' as status;
