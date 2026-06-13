DROP PROCEDURE IF EXISTS processViolationPayment;

CREATE DEFINER="doadmin"@"%" PROCEDURE processViolationPayment(
    IN p_report_id INT,
    IN p_payment_reference VARCHAR(50),
    IN p_paid_amount DECIMAL(10,2),
    IN p_collected_by VARCHAR(255),
    IN p_notes TEXT
)
BEGIN
    DECLARE v_current_status VARCHAR(50);
    DECLARE v_stallholder_id INT;
    DECLARE v_branch_id INT;
    DECLARE v_violation_id INT;
    DECLARE v_penalty_id INT;
    DECLARE v_violation_type VARCHAR(255);
    DECLARE v_unpaid_count INT;
    DECLARE v_payment_notes TEXT;
    
    -- Check if violation report exists
    IF NOT EXISTS (SELECT 1 FROM violation_report WHERE report_id = p_report_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Violation report not found';
    END IF;
    
    -- Get current status, stallholder_id, violation_id from violation_report
    SELECT vr.status, vr.stallholder_id, vr.violation_id, sh.branch_id
    INTO v_current_status, v_stallholder_id, v_violation_id, v_branch_id
    FROM violation_report vr
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    WHERE vr.report_id = p_report_id;
    
    -- Check if already paid
    IF v_current_status = 'Resolved' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: This violation has already been paid';
    END IF;
    
    -- Get violation type for notes
    SELECT v.violation_type INTO v_violation_type
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
        status = 'Resolved',
        payment_status = 'Paid',
        paid_date = NOW(),
        remarks = CASE 
            WHEN p_notes IS NOT NULL AND p_notes != '' 
            THEN CONCAT(COALESCE(remarks, ''), '\n[Payment Note: ', p_notes, ']')
            ELSE remarks 
        END
    WHERE report_id = p_report_id;
    
    -- Insert into penalty_payments table (NOT payments table)
    INSERT INTO penalty_payments (
        report_id,
        stallholder_id,
        violation_id,
        amount,
        payment_date,
        payment_time,
        payment_method,
        reference_number,
        collected_by,
        payment_status,
        notes,
        branch_id,
        created_at
    ) VALUES (
        p_report_id,
        v_stallholder_id,
        v_violation_id,
        p_paid_amount,
        CURDATE(),
        CURTIME(),
        'onsite',
        p_payment_reference,
        p_collected_by,
        'completed',
        v_payment_notes,
        v_branch_id,
        NOW()
    );
    
    -- Check if stallholder has any remaining unpaid violations
    SELECT COUNT(*) INTO v_unpaid_count 
    FROM violation_report 
    WHERE stallholder_id = v_stallholder_id 
    AND status = 'Open';
    
    -- If no more unpaid violations, update compliance status
    IF v_unpaid_count = 0 THEN
        UPDATE stallholder 
        SET compliance_status = 'Compliant'
        WHERE stallholder_id = v_stallholder_id;
    END IF;
    
    -- Return success with payment details
    SELECT 
        'success' as status,
        'Penalty payment processed successfully' as message,
        p_report_id as report_id,
        p_paid_amount as amount_paid,
        p_payment_reference as reference_number,
        v_payment_notes as payment_notes;
END;
