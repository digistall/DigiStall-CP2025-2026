-- =============================================
-- 531: Add Decryption to Violation History Inspector Names
-- Decrypts inspector names in violation history display
-- =============================================

DROP PROCEDURE IF EXISTS `getViolationHistoryByStallholder`;

DELIMITER $$

CREATE PROCEDURE `getViolationHistoryByStallholder`(
    IN `p_stallholder_id` INT
)
BEGIN
    DECLARE v_key VARCHAR(255);
    
    -- Get the encryption key
    SELECT encryption_key INTO v_key 
    FROM encryption_keys 
    WHERE key_name = 'user_data_key' AND is_active = 1 
    LIMIT 1;
    
    -- Select violation history with decrypted inspector names
    SELECT 
        vr.report_id AS violation_id,
        vr.date_reported,
        COALESCE(vr.compliance_type, v.violation_type) AS violation_type,
        v.ordinance_no,
        v.details AS violation_details,
        vr.offense_no,
        vr.severity,
        vr.status,
        vr.evidence,
        vr.remarks,
        vr.receipt_number,
        vp.penalty_amount,
        vp.remarks AS penalty_remarks,
        -- Decrypt inspector name if encrypted
        CASE 
            WHEN i.is_encrypted = 1 AND v_key IS NOT NULL THEN 
                CONCAT(
                    CAST(AES_DECRYPT(FROM_BASE64(i.first_name), v_key) AS CHAR(500)),
                    ' ',
                    CAST(AES_DECRYPT(FROM_BASE64(i.last_name), v_key) AS CHAR(500))
                )
            ELSE 
                CONCAT(i.first_name, ' ', i.last_name)
        END AS inspector_name,
        b.branch_name,
        s.stall_no,
        vr.resolved_date,
        vr.resolved_by
    FROM violation_report vr
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    WHERE vr.stallholder_id = p_stallholder_id
    ORDER BY vr.date_reported DESC;
END$$

DELIMITER ;

SELECT '✅ Migration 531 Complete - Violation history now decrypts inspector names!' as status;
