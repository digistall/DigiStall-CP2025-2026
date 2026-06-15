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
