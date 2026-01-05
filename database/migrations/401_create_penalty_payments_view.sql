-- Migration: 401_create_penalty_payments_view.sql
-- Description: Create view for penalty_payments with proper name joins (like compliance records)
-- Date: January 5, 2026

-- Drop existing view if exists
DROP VIEW IF EXISTS `penalty_payments_view`;

-- Create view that fetches penalty payments with all related names
-- Similar pattern to view_compliance_records that joins with violation_penalty
CREATE VIEW `penalty_payments_view` AS
SELECT 
    pp.penalty_payment_id,
    pp.report_id,
    pp.stallholder_id,
    pp.violation_id,
    pp.penalty_id,
    pp.amount,
    pp.payment_date,
    pp.payment_time,
    pp.payment_method,
    pp.reference_number,
    pp.payment_status,
    pp.notes,
    pp.branch_id,
    pp.created_at,
    pp.updated_at,
    
    -- Stallholder name (fallback to violator_name from violation_report if no stallholder)
    COALESCE(s.stallholder_name, vr.violator_name, 'Unknown') AS stallholder_name,
    
    -- Stall info from stallholder's stall or violation_report's stall
    COALESCE(st.stall_no, st2.stall_no) AS stall_no,
    
    -- Branch info
    b.branch_name,
    
    -- Violation info from violation table or compliance_type from violation_report
    COALESCE(v.violation_type, vr.compliance_type, 'N/A') AS violation_type,
    v.ordinance_no,
    v.details AS violation_details,
    
    -- Penalty info from violation_penalty table (like compliance records)
    vp.penalty_amount,
    vp.remarks AS penalty_remarks,
    
    -- Offense number from violation_report
    vr.offense_no,
    vr.severity,
    
    -- Inspector info (who filed the report)
    CONCAT(COALESCE(i.first_name, ''), ' ', COALESCE(i.last_name, '')) AS inspector_name

FROM penalty_payments pp
LEFT JOIN violation_report vr ON pp.report_id = vr.report_id
LEFT JOIN violation v ON COALESCE(pp.violation_id, vr.violation_id) = v.violation_id
LEFT JOIN violation_penalty vp ON COALESCE(pp.penalty_id, vr.penalty_id) = vp.penalty_id
LEFT JOIN stallholder s ON pp.stallholder_id = s.stallholder_id
LEFT JOIN stall st ON s.stall_id = st.stall_id
LEFT JOIN stall st2 ON vr.stall_id = st2.stall_id
LEFT JOIN branch b ON COALESCE(pp.branch_id, vr.branch_id) = b.branch_id
LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id;

-- Also create a stored procedure for more flexibility (with branch filtering)
DROP PROCEDURE IF EXISTS `getPenaltyPayments`;

DELIMITER $$

CREATE PROCEDURE `getPenaltyPayments`(
    IN p_branch_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    -- Set default values if not provided
    SET p_limit = COALESCE(p_limit, 100);
    SET p_offset = COALESCE(p_offset, 0);
    
    IF p_branch_id IS NULL THEN
        -- Return all penalty payments (for system admin)
        SELECT * FROM penalty_payments_view
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        -- Return penalty payments for specific branch
        SELECT * FROM penalty_payments_view
        WHERE branch_id = p_branch_id
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END$$

DELIMITER ;

-- Procedure for multiple branches (for business owners with multiple branches)
DROP PROCEDURE IF EXISTS `getPenaltyPaymentsByBranches`;

DELIMITER $$

CREATE PROCEDURE `getPenaltyPaymentsByBranches`(
    IN p_branch_ids VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    -- Set default values if not provided
    SET p_limit = COALESCE(p_limit, 100);
    SET p_offset = COALESCE(p_offset, 0);
    
    IF p_branch_ids IS NULL OR p_branch_ids = '' THEN
        -- Return all penalty payments (for system admin)
        SELECT * FROM penalty_payments_view
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        -- Return penalty payments for specific branches using FIND_IN_SET
        SELECT * FROM penalty_payments_view
        WHERE FIND_IN_SET(branch_id, p_branch_ids) > 0
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END$$

DELIMITER ;
