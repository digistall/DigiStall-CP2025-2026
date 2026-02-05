-- =============================================
-- Stored Procedure: sp_getInspectorSentReports
-- Description: Get all violation reports submitted by a specific inspector
-- Parameters:
--   @p_inspector_id INT - The ID of the inspector
-- Returns: List of violation reports with stallholder and violation details
-- =============================================

DELIMITER $$

DROP PROCEDURE IF EXISTS sp_getInspectorSentReports$$

CREATE PROCEDURE sp_getInspectorSentReports(
    IN p_inspector_id INT
)
BEGIN
    SELECT 
        vr.report_id,
        vr.receipt_number,
        vr.stallholder_id,
        vr.violation_id,
        vr.branch_id,
        vr.stall_id,
        vr.inspector_id,
        vr.report_date,
        vr.offense_count,
        vr.penalty_amount,
        vr.payment_status,
        vr.paid_date,
        vr.status,
        vr.remarks,
        vr.evidence,
        vr.created_at,
        vr.updated_at,
        -- Stallholder information (decrypted)
        AES_DECRYPT(
            UNHEX(s.full_name),
            (SELECT encryption_key FROM encryption_keys WHERE key_name = 'stallholder_key' LIMIT 1)
        ) AS stallholder_name,
        -- Violation information
        v.violation_type AS violation_name,
        v.description AS violation_description,
        v.default_penalty,
        -- Stall information (if applicable)
        st.stall_no,
        st.stall_location,
        -- Branch information
        b.branch_name
    FROM violation_report vr
    INNER JOIN stallholder s ON vr.stallholder_id = s.stallholder_id
    INNER JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN stall st ON vr.stall_id = st.stall_id
    INNER JOIN branch b ON vr.branch_id = b.branch_id
    WHERE vr.inspector_id = p_inspector_id
    ORDER BY vr.report_date DESC, vr.created_at DESC;
    
END$$

DELIMITER ;
