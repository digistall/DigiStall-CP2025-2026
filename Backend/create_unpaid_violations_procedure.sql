-- ===== CREATE MISSING STORED PROCEDURE: getUnpaidViolationsByStallholder =====
-- This procedure retrieves unpaid violations for a specific stallholder
-- Used by the payments controller to show pending violation payments


DELIMITER $$

DROP PROCEDURE IF EXISTS `getUnpaidViolationsByStallholder`$$

CREATE PROCEDURE `getUnpaidViolationsByStallholder`(IN p_stallholder_id INT)
BEGIN
  SELECT 
    vr.report_id as violation_id,
    vr.report_date as date_reported,
    v.violation_type,
    vr.offense_count as offense_no,
    CASE 
      WHEN vr.penalty_amount <= 500 THEN 'minor'
      WHEN vr.penalty_amount <= 1000 THEN 'moderate'
      WHEN vr.penalty_amount <= 2000 THEN 'major'
      ELSE 'critical'
    END as severity,
    vr.status,
    NULL as receipt_number,
    COALESCE(vr.penalty_amount, 0) as penalty_amount,
    vr.remarks as penalty_remarks,
    CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, '')) as inspector_name,
    b.branch_name,
    st.stall_number as stall_no,
    vr.stallholder_id
  FROM violation_report vr
  LEFT JOIN violation v ON vr.violation_id = v.violation_id
  LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
  LEFT JOIN stall st ON sh.stall_id = st.stall_id
  LEFT JOIN branch b ON sh.branch_id = b.branch_id
  LEFT JOIN inspector i ON vr.reported_by = i.inspector_id
  WHERE vr.stallholder_id = p_stallholder_id
    AND (vr.payment_status IS NULL OR vr.payment_status != 'paid')
    AND vr.status != 'Resolved'
  ORDER BY vr.report_date DESC;
END$$

DELIMITER ;