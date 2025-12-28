-- Migration: 252_getViolationHistoryByStallholder.sql
-- Description: Get all violation/compliance records for a specific stallholder
-- Date: December 27, 2025

DELIMITER $$

DROP PROCEDURE IF EXISTS `getViolationHistoryByStallholder`$$

CREATE PROCEDURE `getViolationHistoryByStallholder`(
    IN `p_stallholder_id` INT
)
BEGIN
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
        CONCAT(i.first_name, ' ', i.last_name) AS inspector_name,
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
