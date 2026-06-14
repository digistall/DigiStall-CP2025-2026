DROP PROCEDURE IF EXISTS getComplianceRecordById;

CREATE DEFINER="doadmin"@"%" PROCEDURE getComplianceRecordById(IN p_report_id INT)
BEGIN
    SELECT 
        vr.report_id,
        vr.report_id as compliance_id,
        vr.stallholder_id,
        vr.violation_id,
        vr.reported_by,
        vr.reported_by as inspector_id,
        vr.report_date,
        vr.report_date as date,
        vr.report_date as inspection_date,
        vr.offense_count,
        vr.offense_count as offense_no,
        vr.penalty_amount,
        vr.payment_status,
        vr.paid_date,
        vr.paid_date as payment_date,
        vr.remarks,
        vr.status,
        vr.created_at,
        vr.evidence,
        v.violation_type,
        v.violation_type as type,
        v.description as violation_description,
        v.description as violation_details,
        v.default_penalty,
        sh.full_name as stallholder_name,
        sh.full_name as stallholder,
        sh.email as stallholder_email,
        sh.contact_number as stallholder_contact,
        s.stall_number,
        s.stall_number as stall_no,
        s.stall_id,
        s.stall_location,
        sh.branch_id,
        b.branch_name,
        b.area as branch_area,
        CONCAT(i.first_name, ' ', i.last_name) as inspector_name
    FROM violation_report vr
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN inspector i ON vr.reported_by = i.inspector_id
    WHERE vr.report_id = p_report_id;
END;
