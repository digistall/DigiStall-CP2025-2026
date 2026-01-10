-- =============================================
-- 419: Decryption for Compliance, Complaints, and Payments
-- Creates decrypted view and procedures for compliance, complaints, and recent payments
-- =============================================

DELIMITER $$

-- =============================================
-- 1. DECRYPTED VIEW FOR COMPLIANCE RECORDS
-- Replaces view_compliance_records with decryption support
-- =============================================
DROP VIEW IF EXISTS `view_compliance_records_decrypted`$$

-- Note: Views cannot use variables, so we create a stored procedure instead
DROP PROCEDURE IF EXISTS `getAllComplianceRecordsDecrypted`$$

CREATE PROCEDURE `getAllComplianceRecordsDecrypted` (
    IN `p_branch_id` INT, 
    IN `p_status` VARCHAR(20), 
    IN `p_search` VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        vr.report_id AS compliance_id,
        vr.date_reported AS date,
        COALESCE(vr.compliance_type, v.violation_type) AS type,
        -- Decrypt inspector name
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CONCAT(
                CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100)), 
                ' ', 
                CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            )
        ELSE CONCAT(i.first_name, ' ', i.last_name) END AS inspector,
        -- Decrypt stallholder name
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END AS stallholder,
        vr.status AS status,
        vr.severity AS severity,
        vr.remarks AS notes,
        vr.resolved_date AS resolved_date,
        b.branch_name AS branch_name,
        b.branch_id AS branch_id,
        s.stall_no AS stall_no,
        vr.offense_no AS offense_no,
        vp.penalty_amount AS penalty_amount,
        vr.stallholder_id AS stallholder_id,
        vr.stall_id AS stall_id,
        vr.inspector_id AS inspector_id,
        vr.violation_id AS violation_id,
        vr.evidence AS evidence,
        vr.receipt_number AS receipt_number,
        vr.payment_date AS payment_date,
        vr.payment_reference AS payment_reference,
        vr.paid_amount AS paid_amount,
        vr.collected_by AS collected_by,
        v.ordinance_no AS ordinance_no,
        v.details AS violation_details,
        vp.remarks AS penalty_remarks,
        sh.compliance_status AS stallholder_compliance_status,
        -- Decrypt stallholder contact
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
        ELSE sh.contact_number END AS stallholder_contact,
        -- Decrypt stallholder email
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
        ELSE sh.email END AS stallholder_email
    FROM violation_report vr
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    WHERE 
        (p_branch_id IS NULL OR b.branch_id = p_branch_id)
        AND (p_status IS NULL OR p_status = 'all' OR vr.status = p_status)
        AND (
            p_search IS NULL OR p_search = '' OR
            vr.report_id LIKE CONCAT('%', p_search, '%') OR
            COALESCE(vr.compliance_type, v.violation_type) LIKE CONCAT('%', p_search, '%') OR
            CONCAT(i.first_name, ' ', i.last_name) LIKE CONCAT('%', p_search, '%') OR
            sh.stallholder_name LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY vr.date_reported DESC;
END$$

-- =============================================
-- 2. GET COMPLIANCE RECORD BY ID - DECRYPTED
-- =============================================
DROP PROCEDURE IF EXISTS `getComplianceRecordByIdDecrypted`$$

CREATE PROCEDURE `getComplianceRecordByIdDecrypted` (IN `p_report_id` INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        vr.report_id AS compliance_id,
        vr.date_reported AS date,
        COALESCE(vr.compliance_type, v.violation_type) AS type,
        -- Decrypt inspector name
        CASE WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CONCAT(
                CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100)), 
                ' ', 
                CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
            )
        ELSE CONCAT(i.first_name, ' ', i.last_name) END AS inspector,
        -- Decrypt stallholder name
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END AS stallholder,
        vr.status AS status,
        vr.severity AS severity,
        vr.remarks AS notes,
        vr.resolved_date AS resolved_date,
        b.branch_name AS branch_name,
        b.branch_id AS branch_id,
        s.stall_no AS stall_no,
        vr.offense_no AS offense_no,
        vp.penalty_amount AS penalty_amount,
        vr.stallholder_id AS stallholder_id,
        vr.stall_id AS stall_id,
        vr.inspector_id AS inspector_id,
        vr.violation_id AS violation_id,
        vr.evidence AS evidence,
        vr.receipt_number AS receipt_number,
        vr.payment_date AS payment_date,
        vr.payment_reference AS payment_reference,
        vr.paid_amount AS paid_amount,
        vr.collected_by AS collected_by,
        v.ordinance_no AS ordinance_no,
        v.details AS violation_details,
        vp.remarks AS penalty_remarks,
        sh.compliance_status AS stallholder_compliance_status,
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
        ELSE sh.contact_number END AS stallholder_contact,
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
        ELSE sh.email END AS stallholder_email
    FROM violation_report vr
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    WHERE vr.report_id = p_report_id;
END$$

-- =============================================
-- 3. GET COMPLAINTS BY STALLHOLDER - DECRYPTED
-- For mobile complaints page
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getComplaintsByStallholderDecrypted`$$

CREATE PROCEDURE `sp_getComplaintsByStallholderDecrypted`(IN p_stallholder_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.complaint_id,
        c.complaint_type,
        -- Decrypt sender name
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(c.encrypted_sender_name, v_key) AS CHAR(255))
        ELSE c.sender_name END AS sender_name,
        -- Decrypt sender contact
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(c.encrypted_sender_contact, v_key) AS CHAR(50))
        ELSE c.sender_contact END AS sender_contact,
        -- Decrypt sender email
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(c.encrypted_sender_email, v_key) AS CHAR(255))
        ELSE c.sender_email END AS sender_email,
        c.stallholder_id,
        c.stall_id,
        c.branch_id,
        c.subject,
        c.description,
        c.status,
        c.response,
        c.responded_by,
        c.responded_at,
        c.evidence,
        c.created_at,
        c.updated_at,
        b.branch_name,
        s.stall_no
    FROM complaint c
    LEFT JOIN branch b ON c.branch_id = b.branch_id
    LEFT JOIN stall s ON c.stall_id = s.stall_id
    WHERE c.stallholder_id = p_stallholder_id
    ORDER BY c.created_at DESC;
END$$

-- =============================================
-- 4. GET ALL COMPLAINTS - DECRYPTED (for web admin)
-- Matches the original getAllComplaints procedure format
-- =============================================
DROP PROCEDURE IF EXISTS `getAllComplaintsDecrypted`$$

CREATE PROCEDURE `getAllComplaintsDecrypted`(
    IN p_branch_id INT,
    IN p_status VARCHAR(20),
    IN p_search VARCHAR(255)
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        c.complaint_id,
        c.complaint_type,
        c.sender_id,
        -- Decrypt sender name
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(c.encrypted_sender_name, v_key) AS CHAR(255))
        ELSE c.sender_name END AS sender_name,
        -- Decrypt sender contact  
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(c.encrypted_sender_contact, v_key) AS CHAR(50))
        ELSE c.sender_contact END AS sender_contact,
        -- Decrypt sender email
        CASE WHEN c.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(c.encrypted_sender_email, v_key) AS CHAR(255))
        ELSE c.sender_email END AS sender_email,
        c.stallholder_id,
        -- Decrypt stallholder name from stallholder table
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END AS stallholder_name,
        c.stall_id,
        s.stall_no,
        c.branch_id,
        b.branch_name,
        c.subject,
        c.description,
        c.evidence,
        c.status,
        c.priority,
        c.resolution_notes,
        c.date_submitted,
        c.date_resolved,
        c.created_at,
        c.updated_at
    FROM complaint c
    LEFT JOIN stallholder sh ON c.stallholder_id = sh.stallholder_id
    LEFT JOIN stall s ON c.stall_id = s.stall_id
    LEFT JOIN branch b ON c.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR c.branch_id = p_branch_id)
    AND (p_status IS NULL OR p_status = 'all' OR c.status = p_status)
    AND (
        p_search IS NULL OR p_search = '' OR
        c.complaint_id LIKE CONCAT('%', p_search, '%') OR
        c.complaint_type LIKE CONCAT('%', p_search, '%') OR
        c.sender_name LIKE CONCAT('%', p_search, '%') OR
        sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
        c.subject LIKE CONCAT('%', p_search, '%')
    )
    ORDER BY c.date_submitted DESC;
END$$

-- =============================================
-- 5. GET ONSITE PAYMENTS ALL - DECRYPTED
-- For dashboard recent payments (system admin)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getOnsitePaymentsAllDecrypted`$$

CREATE PROCEDURE `sp_getOnsitePaymentsAllDecrypted`(
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        p.payment_id as id,
        p.stallholder_id as stallholderId,
        -- Decrypt stallholder name
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END as stallholderName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        p.amount as amountPaid,
        p.payment_date as paymentDate,
        p.payment_time as paymentTime,
        p.payment_for_month as paymentForMonth,
        p.payment_type as paymentType,
        'Cash (Onsite)' as paymentMethod,
        p.reference_number as referenceNo,
        p.collected_by as collectedBy,
        p.notes,
        p.payment_status as status,
        p.created_at as createdAt,
        COALESCE(b.branch_name, 'Unknown') as branchName
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE p.payment_method = 'onsite'
    AND (
        p_search = '' OR p_search IS NULL OR
        p.reference_number LIKE CONCAT('%', p_search, '%') OR
        sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
        st.stall_no LIKE CONCAT('%', p_search, '%')
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END$$

-- =============================================
-- 6. GET ONSITE PAYMENTS BY BRANCHES - DECRYPTED
-- For dashboard recent payments (managers/owners)
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getOnsitePaymentsByBranchesDecrypted`$$

CREATE PROCEDURE `sp_getOnsitePaymentsByBranchesDecrypted`(
    IN p_branch_ids VARCHAR(500),
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SET @sql = CONCAT('
        SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            CASE WHEN sh.is_encrypted = 1 AND ''', IFNULL(v_key, ''), ''' != '''' THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, ''', IFNULL(v_key, ''), ''') AS CHAR(255))
            ELSE sh.stallholder_name END as stallholderName,
            COALESCE(st.stall_no, ''N/A'') as stallNo,
            p.amount as amountPaid,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.payment_for_month as paymentForMonth,
            p.payment_type as paymentType,
            ''Cash (Onsite)'' as paymentMethod,
            p.reference_number as referenceNo,
            p.collected_by as collectedBy,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            COALESCE(b.branch_name, ''Unknown'') as branchName
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.branch_id IN (', p_branch_ids, ')
        AND p.payment_method = ''onsite''
        AND (
            ''', IFNULL(p_search, ''), ''' = '''' OR
            p.reference_number LIKE ''%', IFNULL(p_search, ''), '%'' OR
            sh.stallholder_name LIKE ''%', IFNULL(p_search, ''), '%'' OR
            st.stall_no LIKE ''%', IFNULL(p_search, ''), '%''
        )
        ORDER BY p.created_at DESC
        LIMIT ', p_limit, ' OFFSET ', p_offset
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- =============================================
-- 7. GET ONLINE PAYMENTS ALL - DECRYPTED
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getOnlinePaymentsAllDecrypted`$$

CREATE PROCEDURE `sp_getOnlinePaymentsAllDecrypted`(
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        p.payment_id as id,
        p.stallholder_id as stallholderId,
        -- Decrypt stallholder name
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END as stallholderName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        p.amount as amountPaid,
        p.payment_date as paymentDate,
        p.payment_time as paymentTime,
        p.payment_for_month as paymentForMonth,
        p.payment_type as paymentType,
        p.payment_method as paymentMethod,
        p.reference_number as referenceNo,
        p.gcash_reference_number as gcashReferenceNo,
        p.gcash_screenshot as gcashScreenshot,
        p.notes,
        p.payment_status as status,
        p.created_at as createdAt,
        COALESCE(b.branch_name, 'Unknown') as branchName
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE p.payment_method != 'onsite'
    AND (
        p_search = '' OR p_search IS NULL OR
        p.reference_number LIKE CONCAT('%', p_search, '%') OR
        p.gcash_reference_number LIKE CONCAT('%', p_search, '%') OR
        sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
        st.stall_no LIKE CONCAT('%', p_search, '%')
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END$$

-- =============================================
-- 8. GET ONLINE PAYMENTS BY BRANCHES - DECRYPTED
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getOnlinePaymentsByBranchesDecrypted`$$

CREATE PROCEDURE `sp_getOnlinePaymentsByBranchesDecrypted`(
    IN p_branch_ids VARCHAR(500),
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SET @sql = CONCAT('
        SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            CASE WHEN sh.is_encrypted = 1 AND ''', IFNULL(v_key, ''), ''' != '''' THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, ''', IFNULL(v_key, ''), ''') AS CHAR(255))
            ELSE sh.stallholder_name END as stallholderName,
            COALESCE(st.stall_no, ''N/A'') as stallNo,
            p.amount as amountPaid,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.payment_for_month as paymentForMonth,
            p.payment_type as paymentType,
            p.payment_method as paymentMethod,
            p.reference_number as referenceNo,
            p.gcash_reference_number as gcashReferenceNo,
            p.gcash_screenshot as gcashScreenshot,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            COALESCE(b.branch_name, ''Unknown'') as branchName
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.branch_id IN (', p_branch_ids, ')
        AND p.payment_method != ''onsite''
        AND (
            ''', IFNULL(p_search, ''), ''' = '''' OR
            p.reference_number LIKE ''%', IFNULL(p_search, ''), '%'' OR
            p.gcash_reference_number LIKE ''%', IFNULL(p_search, ''), '%'' OR
            sh.stallholder_name LIKE ''%', IFNULL(p_search, ''), '%'' OR
            st.stall_no LIKE ''%', IFNULL(p_search, ''), '%''
        )
        ORDER BY p.created_at DESC
        LIMIT ', p_limit, ' OFFSET ', p_offset
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- =============================================
-- 9. GET STALLHOLDER DETAILS FOR COMPLAINT - DECRYPTED
-- Helper for complaint submission
-- =============================================
DROP PROCEDURE IF EXISTS `sp_getStallholderDetailsForComplaintDecrypted`$$

CREATE PROCEDURE `sp_getStallholderDetailsForComplaintDecrypted`(IN p_stallholder_id INT)
BEGIN
    DECLARE v_key VARCHAR(64);
    
    SELECT encryption_key INTO v_key FROM encryption_keys WHERE key_name = 'user_data_key' AND is_active = 1 LIMIT 1;
    
    SELECT 
        sh.stallholder_id,
        -- Decrypt name
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
        ELSE sh.stallholder_name END AS sender_name,
        -- Decrypt contact
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
        ELSE sh.contact_number END AS sender_contact,
        -- Decrypt email
        CASE WHEN sh.is_encrypted = 1 AND v_key IS NOT NULL THEN 
            CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
        ELSE sh.email END AS sender_email,
        sh.branch_id,
        sh.stall_id
    FROM stallholder sh
    WHERE sh.stallholder_id = p_stallholder_id;
END$$

DELIMITER ;

SELECT '✅ Migration 419 complete - Compliance, Complaints, and Payments decryption procedures ready!' as status;
