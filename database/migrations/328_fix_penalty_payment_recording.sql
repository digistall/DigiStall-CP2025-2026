-- Migration: 328_fix_penalty_payment_recording.sql
-- Description: Fix penalty payment to also record in payments table
-- Date: January 4, 2026
-- Issue: Penalty payments were only updating violation_report but not recording in payments table

DELIMITER $$

DROP PROCEDURE IF EXISTS `processViolationPayment`$$

CREATE PROCEDURE `processViolationPayment`(
    IN `p_report_id` INT,
    IN `p_payment_reference` VARCHAR(50),
    IN `p_paid_amount` DECIMAL(10,2),
    IN `p_collected_by` VARCHAR(255),
    IN `p_notes` TEXT
)
BEGIN
    DECLARE v_current_status VARCHAR(50);
    DECLARE v_stallholder_id INT;
    DECLARE v_branch_id INT;
    DECLARE v_violation_type VARCHAR(255);
    DECLARE v_penalty_amount DECIMAL(10,2);
    DECLARE v_unpaid_count INT;
    DECLARE v_payment_id INT;
    DECLARE v_payment_notes TEXT;
    
    -- Check if violation report exists
    IF NOT EXISTS (SELECT 1 FROM violation_report WHERE report_id = p_report_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Violation report not found';
    END IF;
    
    -- Get current status, stallholder_id, and branch_id
    SELECT status, stallholder_id, branch_id INTO v_current_status, v_stallholder_id, v_branch_id
    FROM violation_report WHERE report_id = p_report_id;
    
    -- Check if already paid
    IF v_current_status = 'complete' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: This violation has already been paid';
    END IF;
    
    -- Get violation type for notes
    SELECT COALESCE(v.violation_type, vr.compliance_type) INTO v_violation_type
    FROM violation_report vr
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    WHERE vr.report_id = p_report_id;
    
    -- Prepare payment notes
    SET v_payment_notes = CONCAT('Penalty Payment for Violation Report #', p_report_id, ' - ', COALESCE(v_violation_type, 'Unknown Violation'));
    IF p_notes IS NOT NULL AND p_notes != '' THEN
        SET v_payment_notes = CONCAT(v_payment_notes, ' | Note: ', p_notes);
    END IF;
    
    -- Update violation report with payment info
    UPDATE violation_report
    SET 
        status = 'complete',
        payment_date = NOW(),
        payment_reference = p_payment_reference,
        paid_amount = p_paid_amount,
        collected_by = p_collected_by,
        resolved_date = NOW(),
        remarks = CASE 
            WHEN p_notes IS NOT NULL AND p_notes != '' 
            THEN CONCAT(COALESCE(remarks, ''), '\n[Payment Note: ', p_notes, ']')
            ELSE remarks 
        END
    WHERE report_id = p_report_id;
    
    -- Insert into payments table with payment_type = 'penalty'
    INSERT INTO payments (
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        branch_id,
        created_at
    ) VALUES (
        v_stallholder_id,
        'onsite',
        p_paid_amount,
        CURDATE(),
        CURTIME(),
        DATE_FORMAT(NOW(), '%Y-%m'),
        'penalty',
        p_payment_reference,
        p_collected_by,
        'completed',
        v_payment_notes,
        v_branch_id,
        NOW()
    );
    
    -- Get the inserted payment ID
    SET v_payment_id = LAST_INSERT_ID();
    
    -- Check if stallholder has any remaining unpaid violations
    SELECT COUNT(*) INTO v_unpaid_count 
    FROM violation_report 
    WHERE stallholder_id = v_stallholder_id 
      AND status != 'complete';
    
    -- If no unpaid violations, set compliance_status to 'Compliant'
    IF v_unpaid_count = 0 THEN
        UPDATE stallholder 
        SET compliance_status = 'Compliant'
        WHERE stallholder_id = v_stallholder_id;
    END IF;
    
    -- Get violation details for response (including the new payment_id)
    SELECT 
        vr.report_id,
        vr.status,
        vr.payment_date,
        vr.payment_reference,
        vr.paid_amount,
        vr.collected_by,
        COALESCE(v.violation_type, vr.compliance_type) AS violation_type,
        vp.penalty_amount AS original_penalty,
        sh.stallholder_name AS stallholder_name,
        s.stall_no,
        b.branch_name,
        sh.compliance_status,
        v_payment_id AS payment_id
    FROM violation_report vr
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    WHERE vr.report_id = p_report_id;
    
END$$

DELIMITER ;