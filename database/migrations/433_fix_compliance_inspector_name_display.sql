-- =============================================
-- Migration 433: Fix Compliance Inspector Name Display
-- =============================================
-- Issue: Inspector names showing encrypted in compliance page
-- Solution: Update getAllComplianceRecordsDecrypted to properly decrypt inspector names
-- Date: 2026-01-11
-- =============================================

USE naga_stall;

DELIMITER $$

-- =============================================
-- Fix getAllComplianceRecordsDecrypted - Properly decrypt inspector names
-- =============================================

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
        -- Inspector name - FIXED: Decrypt from first_name/last_name columns when is_encrypted=1
        CASE 
            WHEN i.inspector_id IS NULL THEN NULL
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL THEN
                TRIM(CONCAT(
                    COALESCE(CAST(AES_DECRYPT(FROM_BASE64(i.first_name), v_key) AS CHAR(500)), ''),
                    ' ',
                    COALESCE(CAST(AES_DECRYPT(FROM_BASE64(i.last_name), v_key) AS CHAR(500)), '')
                ))
            ELSE CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, ''))
        END AS inspector,
        -- Stallholder name
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE COALESCE(sh.stallholder_name, '') 
        END AS stallholder,
        vr.status AS status,
        vr.severity AS severity,
        vr.remarks AS notes,
        vr.resolved_date AS resolved_date,
        b.branch_name AS branch_name,
        b.branch_id AS branch_id,
        COALESCE(s.stall_no, '') AS stall_no,
        COALESCE(vr.offense_no, 1) AS offense_no,
        COALESCE(vp.penalty_amount, 0) AS penalty_amount,
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
        COALESCE(sh.compliance_status, 'unknown') AS stallholder_compliance_status,
        -- Stallholder contact
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(sh.contact_number, '') 
        END AS stallholder_contact,
        -- Stallholder email
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
            ELSE COALESCE(sh.email, '') 
        END AS stallholder_email
    FROM violation_report vr
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    WHERE 
        (p_branch_id IS NULL OR vr.branch_id = p_branch_id)
        AND (p_status IS NULL OR p_status COLLATE utf8mb4_general_ci = 'all' OR vr.status COLLATE utf8mb4_general_ci = p_status COLLATE utf8mb4_general_ci)
        AND (
            p_search IS NULL OR p_search = '' OR
            CAST(vr.report_id AS CHAR) COLLATE utf8mb4_general_ci LIKE CONCAT('%', p_search, '%') OR
            COALESCE(vr.compliance_type, v.violation_type, '') COLLATE utf8mb4_general_ci LIKE CONCAT('%', p_search, '%') OR
            -- Search in decrypted names
            CONCAT(
                CASE 
                    WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                        CAST(AES_DECRYPT(FROM_BASE64(i.encrypted_first_name), v_key) AS CHAR(500))
                    WHEN i.first_name IS NOT NULL AND v_key IS NOT NULL THEN
                        CAST(AES_DECRYPT(FROM_BASE64(i.first_name), v_key) AS CHAR(500))
                    ELSE COALESCE(i.first_name, '') 
                END,
                ' ',
                CASE 
                    WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
                        CAST(AES_DECRYPT(FROM_BASE64(i.encrypted_last_name), v_key) AS CHAR(500))
                    WHEN i.last_name IS NOT NULL AND v_key IS NOT NULL THEN
                        CAST(AES_DECRYPT(FROM_BASE64(i.last_name), v_key) AS CHAR(500))
                    ELSE COALESCE(i.last_name, '') 
                END
            ) COLLATE utf8mb4_general_ci LIKE CONCAT('%', p_search, '%') OR
            CASE 
                WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                    CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
                ELSE COALESCE(sh.stallholder_name, '') 
            END COLLATE utf8mb4_general_ci LIKE CONCAT('%', p_search, '%')
        )
    ORDER BY vr.date_reported DESC;
END$$

-- =============================================
-- Fix getComplianceRecordByIdDecrypted - Properly decrypt inspector names
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
        -- Inspector name - FIXED: Decrypt each name separately like employee procedures
        CONCAT(
            CASE 
                WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                    CAST(AES_DECRYPT(i.encrypted_first_name, v_key) AS CHAR(100))
                ELSE COALESCE(i.first_name, '') 
            END,
            ' ',
            CASE 
                WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
                    CAST(AES_DECRYPT(i.encrypted_last_name, v_key) AS CHAR(100))
                ELSE COALESCE(i.last_name, '') 
            END
        ) AS inspector,
        -- Stallholder name
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_name, v_key) AS CHAR(255))
            ELSE COALESCE(sh.stallholder_name, '') 
        END AS stallholder,
        vr.status AS status,
        vr.severity AS severity,
        vr.remarks AS notes,
        vr.resolved_date AS resolved_date,
        b.branch_name AS branch_name,
        b.branch_id AS branch_id,
        COALESCE(s.stall_no, '') AS stall_no,
        COALESCE(vr.offense_no, 1) AS offense_no,
        COALESCE(vp.penalty_amount, 0) AS penalty_amount,
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
        COALESCE(sh.compliance_status, 'unknown') AS stallholder_compliance_status,
        -- Stallholder contact
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(sh.contact_number, '') 
        END AS stallholder_contact,
        -- Stallholder email
        CASE 
            WHEN COALESCE(sh.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND sh.encrypted_email IS NOT NULL THEN 
                CAST(AES_DECRYPT(sh.encrypted_email, v_key) AS CHAR(255))
            ELSE COALESCE(sh.email, '') 
        END AS stallholder_email,
        -- Inspector details
        i.inspector_id,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_first_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(FROM_BASE64(i.encrypted_first_name), v_key) AS CHAR(500))
            WHEN i.first_name IS NOT NULL AND v_key IS NOT NULL THEN
                CAST(AES_DECRYPT(FROM_BASE64(i.first_name), v_key) AS CHAR(500))
            ELSE COALESCE(i.first_name, '') 
        END AS inspector_first_name,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_last_name IS NOT NULL THEN 
                CAST(AES_DECRYPT(FROM_BASE64(i.encrypted_last_name), v_key) AS CHAR(500))
            WHEN i.last_name IS NOT NULL AND v_key IS NOT NULL THEN
                CAST(AES_DECRYPT(FROM_BASE64(i.last_name), v_key) AS CHAR(500))
            ELSE COALESCE(i.last_name, '') 
        END AS inspector_last_name,
        CASE 
            WHEN COALESCE(i.is_encrypted, 0) = 1 AND v_key IS NOT NULL AND i.encrypted_contact IS NOT NULL THEN 
                CAST(AES_DECRYPT(i.encrypted_contact, v_key) AS CHAR(50))
            ELSE COALESCE(i.contact_no, '') 
        END AS inspector_contact
    FROM violation_report vr
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    WHERE vr.report_id = p_report_id;
END$$

DELIMITER ;

-- =============================================
-- Verify the fix
-- =============================================

SELECT '✅ Testing getAllComplianceRecordsDecrypted...' as step;
CALL getAllComplianceRecordsDecrypted(NULL, 'all', NULL);

SELECT '✅ Migration 433 complete!' as status;
SELECT 'Inspector names in compliance records will now be properly decrypted.' as note;
SELECT 'Please restart your backend servers for the changes to take effect.' as action;
