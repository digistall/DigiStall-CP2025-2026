-- ===== MIGRATION 023: DYNAMIC OFFENSE STACKING AND COMPLIANCE SYSTEM PROCEDURES =====
-- This migration updates the reportStallholder procedure to handle auto-stacking,
-- and defines the missing stored procedures required by the compliance module.

-- 1. DROP and CREATE reportStallholder
DROP PROCEDURE IF EXISTS reportStallholder;

CREATE DEFINER="doadmin"@"%" PROCEDURE reportStallholder(
    IN p_inspector_id INT,
    IN p_stallholder_id INT,
    IN p_violation_id INT,
    IN p_branch_id INT,
    IN p_stall_id INT,
    IN p_receipt_number VARCHAR(50),
    IN p_evidence TEXT,
    IN p_remarks TEXT
)
BEGIN
    DECLARE v_offense_count INT DEFAULT 1;
    DECLARE v_penalty_amount DECIMAL(10,2);
    DECLARE v_default_penalty DECIMAL(10,2);

    -- Calculate next offense count
    SELECT COALESCE(MAX(offense_count), 0) + 1 INTO v_offense_count
    FROM violation_report
    WHERE stallholder_id = p_stallholder_id AND violation_id = p_violation_id;

    -- Get penalty amount based on offense level from violation_penalty table
    SELECT penalty_amount INTO v_penalty_amount
    FROM violation_penalty
    WHERE violation_id = p_violation_id
      AND offense_level = CASE 
          WHEN v_offense_count = 1 THEN '1st'
          WHEN v_offense_count = 2 THEN '2nd'
          WHEN v_offense_count = 3 THEN '3rd'
          WHEN v_offense_count = 4 THEN '4th'
          ELSE '5th'
      END
    LIMIT 1;

    -- Get default penalty as fallback
    SELECT default_penalty INTO v_default_penalty
    FROM violation
    WHERE violation_id = p_violation_id;

    -- Insert new violation report
    INSERT INTO violation_report (
        stallholder_id,
        violation_id,
        reported_by,
        report_date,
        offense_count,
        penalty_amount,
        payment_status,
        remarks,
        status
    ) VALUES (
        p_stallholder_id,
        p_violation_id,
        p_inspector_id,
        NOW(),
        v_offense_count,
        COALESCE(v_penalty_amount, v_default_penalty, 0.00),
        'Unpaid',
        CONCAT_WS(' | ', 
            CONCAT('Receipt: ', p_receipt_number),
            CONCAT('Evidence: ', p_evidence),
            p_remarks
        ),
        'Open'
    );

    SELECT LAST_INSERT_ID() as report_id;
END;


-- 2. DROP and CREATE createComplianceRecord
DROP PROCEDURE IF EXISTS createComplianceRecord;

CREATE DEFINER="doadmin"@"%" PROCEDURE createComplianceRecord(
    IN p_inspector_id INT,
    IN p_stallholder_id INT,
    IN p_violation_id INT,
    IN p_stall_id INT,
    IN p_branch_id INT,
    IN p_compliance_type VARCHAR(100),
    IN p_severity VARCHAR(50),
    IN p_remarks TEXT,
    IN p_offense_no INT,
    IN p_penalty_id INT
)
BEGIN
    DECLARE v_offense_count INT DEFAULT 1;
    DECLARE v_penalty_amount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_default_penalty DECIMAL(10,2) DEFAULT 0.00;

    -- Calculate next offense count if violation_id is provided
    IF p_violation_id IS NOT NULL THEN
        SELECT COALESCE(MAX(offense_count), 0) + 1 INTO v_offense_count
        FROM violation_report
        WHERE stallholder_id = p_stallholder_id AND violation_id = p_violation_id;
        
        -- Get penalty amount based on offense level from violation_penalty table
        IF p_penalty_id IS NOT NULL THEN
            SELECT penalty_amount INTO v_penalty_amount
            FROM violation_penalty
            WHERE penalty_id = p_penalty_id;
        ELSE
            SELECT penalty_amount INTO v_penalty_amount
            FROM violation_penalty
            WHERE violation_id = p_violation_id
              AND offense_level = CASE 
                  WHEN v_offense_count = 1 THEN '1st'
                  WHEN v_offense_count = 2 THEN '2nd'
                  WHEN v_offense_count = 3 THEN '3rd'
                  WHEN v_offense_count = 4 THEN '4th'
                  ELSE '5th'
              END
            LIMIT 1;
        END IF;

        -- Fallback to default penalty of violation type if still NULL/0
        IF v_penalty_amount IS NULL OR v_penalty_amount = 0 THEN
            SELECT default_penalty INTO v_default_penalty
            FROM violation
            WHERE violation_id = p_violation_id;
            
            SET v_penalty_amount = COALESCE(v_default_penalty, 0.00);
        END IF;
    ELSE
        -- If it's a general compliance type without violation_id
        SET v_offense_count = COALESCE(p_offense_no, 1);
        SET v_penalty_amount = 0.00;
    END IF;

    -- Insert new violation report
    INSERT INTO violation_report (
        stallholder_id,
        violation_id,
        reported_by,
        report_date,
        offense_count,
        penalty_amount,
        payment_status,
        remarks,
        status
    ) VALUES (
        p_stallholder_id,
        COALESCE(p_violation_id, 1), -- violation_id is NOT NULL in schema, fallback to 1 (Late Payment) if null
        p_inspector_id,
        NOW(),
        v_offense_count,
        v_penalty_amount,
        'Unpaid',
        CONCAT_WS(' | ', p_compliance_type, p_remarks),
        'Open'
    );

    SELECT LAST_INSERT_ID() as report_id;
END;


-- 3. DROP and CREATE updateComplianceRecord
DROP PROCEDURE IF EXISTS updateComplianceRecord;

CREATE DEFINER="doadmin"@"%" PROCEDURE updateComplianceRecord(
    IN p_report_id INT,
    IN p_status VARCHAR(50),
    IN p_remarks TEXT,
    IN p_user_id INT
)
BEGIN
    DECLARE v_db_status VARCHAR(50);
    
    IF p_status = 'complete' THEN
        SET v_db_status = 'Resolved';
    ELSE
        SET v_db_status = 'Open';
    END IF;

    UPDATE violation_report
    SET 
        status = v_db_status,
        remarks = COALESCE(p_remarks, remarks)
    WHERE report_id = p_report_id;
    
    -- Update overall compliance status of the stallholder
    UPDATE stallholder sh
    SET sh.compliance_status = CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM violation_report vr 
            WHERE vr.stallholder_id = sh.stallholder_id 
              AND vr.status = 'Open'
        ) THEN 'Non-Compliant'
        ELSE 'Compliant'
    END
    WHERE sh.stallholder_id = (SELECT stallholder_id FROM violation_report WHERE report_id = p_report_id);
END;


-- 4. DROP and CREATE deleteComplianceRecord
DROP PROCEDURE IF EXISTS deleteComplianceRecord;

CREATE DEFINER="doadmin"@"%" PROCEDURE deleteComplianceRecord(IN p_report_id INT)
BEGIN
    DECLARE v_stallholder_id INT;
    
    SELECT stallholder_id INTO v_stallholder_id 
    FROM violation_report 
    WHERE report_id = p_report_id;

    DELETE FROM violation_report WHERE report_id = p_report_id;

    -- Update overall compliance status of the stallholder
    IF v_stallholder_id IS NOT NULL THEN
        UPDATE stallholder sh
        SET sh.compliance_status = CASE 
            WHEN EXISTS (
                SELECT 1 
                FROM violation_report vr 
                WHERE vr.stallholder_id = sh.stallholder_id 
                  AND vr.status = 'Open'
            ) THEN 'Non-Compliant'
            ELSE 'Compliant'
        END
        WHERE sh.stallholder_id = v_stallholder_id;
    END IF;
END;


-- 5. DROP and CREATE checkComplianceRecordExists
DROP PROCEDURE IF EXISTS checkComplianceRecordExists;

CREATE DEFINER="doadmin"@"%" PROCEDURE checkComplianceRecordExists(IN p_report_id INT)
BEGIN
    SELECT COUNT(*) as record_exists FROM violation_report WHERE report_id = p_report_id;
END;


-- 6. DROP and CREATE getComplianceRecordById
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


-- 7. DROP and CREATE getComplianceStatistics
DROP PROCEDURE IF EXISTS getComplianceStatistics;

CREATE DEFINER="doadmin"@"%" PROCEDURE getComplianceStatistics(IN p_branch_id INT)
BEGIN
    SELECT 
        COUNT(*) as total_records,
        SUM(CASE WHEN vr.status = 'Open' THEN 1 ELSE 0 END) as pending_count,
        0 as in_progress_count,
        SUM(CASE WHEN vr.status = 'Resolved' THEN 1 ELSE 0 END) as complete_count,
        SUM(CASE WHEN vr.status = 'Appealed' THEN 1 ELSE 0 END) as incomplete_count,
        0 as critical_count,
        0 as major_count
    FROM violation_report vr
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    WHERE p_branch_id IS NULL OR sh.branch_id = p_branch_id;
END;


-- 8. DROP and CREATE getAllActiveInspectors
DROP PROCEDURE IF EXISTS getAllActiveInspectors;

CREATE DEFINER="doadmin"@"%" PROCEDURE getAllActiveInspectors()
BEGIN
    SELECT 
        inspector_id,
        CONCAT(first_name, ' ', last_name) as inspector_name,
        first_name,
        last_name,
        email,
        contact_number as contact_no,
        status,
        date_hired
    FROM inspector
    WHERE status = 'Active';
END;


-- 9. DROP and CREATE getAllViolationTypes
DROP PROCEDURE IF EXISTS getAllViolationTypes;

CREATE DEFINER="doadmin"@"%" PROCEDURE getAllViolationTypes()
BEGIN
    SELECT 
        violation_id,
        violation_type,
        description as details
    FROM violation
    WHERE status = 'Active';
END;


-- 10. DROP and CREATE getViolationPenaltiesByViolationId
DROP PROCEDURE IF EXISTS getViolationPenaltiesByViolationId;

CREATE DEFINER="doadmin"@"%" PROCEDURE getViolationPenaltiesByViolationId(IN p_violation_id INT)
BEGIN
    SELECT 
        penalty_id,
        violation_id,
        offense_level,
        penalty_amount,
        description
    FROM violation_penalty
    WHERE violation_id = p_violation_id;
END;


-- 11. DROP and CREATE getStallholderBranchId
DROP PROCEDURE IF EXISTS getStallholderBranchId;

CREATE DEFINER="doadmin"@"%" PROCEDURE getStallholderBranchId(IN p_stallholder_id INT)
BEGIN
    SELECT branch_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
END;


-- 12. DROP and CREATE processViolationPayment
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

