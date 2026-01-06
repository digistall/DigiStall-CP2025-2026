-- Migration: 250_addReceiptNumberToViolationReport.sql
-- Description: Add receipt_number column to violation_report table and update stored procedure
-- Date: December 27, 2025

-- Step 1: Add receipt_number column to violation_report table (7-digit integer)
ALTER TABLE `violation_report` 
ADD COLUMN `receipt_number` INT(7) NULL AFTER `remarks`;

-- Step 2: Create index for faster lookups on receipt_number
ALTER TABLE `violation_report`
ADD INDEX `idx_receipt_number` (`receipt_number`);

-- Step 3: Update the stored procedure to accept receipt_number as input
DELIMITER $$

DROP PROCEDURE IF EXISTS `reportStallholder`$$

CREATE PROCEDURE `reportStallholder`(
    IN `p_inspector_id` INT, 
    IN `p_stallholder_id` INT, 
    IN `p_violation_id` INT, 
    IN `p_branch_id` INT, 
    IN `p_stall_id` INT, 
    IN `p_evidence` TEXT, 
    IN `p_remarks` TEXT,
    IN `p_receipt_number` INT
)
BEGIN
    DECLARE v_offense_no INT;
    DECLARE v_penalty_amount DECIMAL(10,2);
    DECLARE v_penalty_remarks VARCHAR(255);
    DECLARE v_penalty_id INT DEFAULT NULL;

    -- Validate violation_id
    IF NOT EXISTS (SELECT 1 FROM violation WHERE violation_id = p_violation_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Invalid violation_id provided';
    END IF;

    -- Validate stallholder_id
    IF NOT EXISTS (SELECT 1 FROM stallholder WHERE stallholder_id = p_stallholder_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Invalid stallholder_id provided';
    END IF;

    -- Count previous offenses for this stallholder and violation type
    SELECT COUNT(*) + 1 INTO v_offense_no FROM violation_report
    WHERE stallholder_id = p_stallholder_id AND violation_id = p_violation_id;

    -- Get the appropriate penalty based on offense number
    SELECT vp.penalty_id, vp.penalty_amount, vp.remarks INTO v_penalty_id, v_penalty_amount, v_penalty_remarks
    FROM violation_penalty vp
    WHERE vp.violation_id = p_violation_id
      AND vp.offense_no = (SELECT MAX(offense_no) FROM violation_penalty
                           WHERE violation_id = p_violation_id AND offense_no <= v_offense_no);

    -- Check if penalty exists
    IF v_penalty_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: No penalty defined for this violation type';
    END IF;

    -- Insert the violation report
    INSERT INTO violation_report (
        inspector_id, 
        stallholder_id, 
        violator_name, 
        violation_id, 
        branch_id, 
        stall_id, 
        evidence, 
        date_reported, 
        offense_no, 
        penalty_id, 
        remarks,
        receipt_number
    )
    VALUES (
        p_inspector_id, 
        p_stallholder_id, 
        NULL, 
        p_violation_id, 
        p_branch_id, 
        p_stall_id, 
        p_evidence, 
        NOW(),
        v_offense_no, 
        v_penalty_id,
        CONCAT_WS(' | ', p_remarks, CONCAT('Offense #', v_offense_no), 
                  CONCAT('Fine: ₱', IFNULL(v_penalty_amount, '0.00')), IFNULL(v_penalty_remarks, '')),
        p_receipt_number
    );

    -- Update stallholder compliance status
    UPDATE stallholder SET compliance_status = 'Non-Compliant', last_violation_date = NOW()
    WHERE stallholder_id = p_stallholder_id;
END$$

DELIMITER ;
