CREATE DEFINER="doadmin"@"%" PROCEDURE "sp_getInspectorSentReports"(
    IN p_inspector_id INT
)
BEGIN
    SELECT 
        vr.report_id,
        vr.stallholder_id,
        vr.violation_id,
        vr.reported_by,
        vr.report_date,
        vr.offense_count,
        vr.penalty_amount,
        vr.payment_status,
        vr.paid_date,
        vr.status,
        vr.remarks,
        vr.evidence,
        vr.created_at,
    
        -- Stallholder information
        s.full_name AS stallholder_name,
        -- Violation information
        v.violation_type AS violation_name,
        v.description AS violation_description,
        v.default_penalty
    FROM violation_report vr
    INNER JOIN stallholder s ON vr.stallholder_id = s.stallholder_id
    INNER JOIN violation v ON vr.violation_id = v.violation_id
    WHERE vr.reported_by = p_inspector_id
    ORDER BY vr.report_date DESC, vr.created_at DESC;
    
END