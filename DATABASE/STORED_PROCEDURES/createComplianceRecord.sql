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
