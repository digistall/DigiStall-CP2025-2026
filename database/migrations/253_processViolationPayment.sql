-- Migration: 253_processViolationPayment.sql
-- Description: Process payment for a violation and update status to complete
-- Date: December 27, 2025

-- Step 1: Add payment_date and payment_reference columns to violation_report if not exist
ALTER TABLE `violation_report` 
ADD COLUMN `payment_date` DATETIME NULL AFTER `receipt_number`,
ADD COLUMN  `payment_reference` VARCHAR(50) NULL AFTER `payment_date`,
ADD COLUMN `paid_amount` DECIMAL(10,2) NULL AFTER `payment_reference`,
ADD COLUMN `collected_by` VARCHAR(255) NULL AFTER `paid_amount`;

-- Step 2: Create index for faster lookups
ALTER TABLE `violation_report`
ADD INDEX `idx_payment_reference` (`payment_reference`);

-- Step 3: Create stored procedure to process violation payment
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
    DECLARE v_violation_type VARCHAR(255);
    DECLARE v_penalty_amount DECIMAL(10,2);
    DECLARE v_unpaid_count INT;
    
    -- Check if violation report exists
    IF NOT EXISTS (SELECT 1 FROM violation_report WHERE report_id = p_report_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Violation report not found';
    END IF;
    
    -- Get current status
    SELECT status, stallholder_id INTO v_current_status, v_stallholder_id 
    FROM violation_report WHERE report_id = p_report_id;
    
    -- Check if already paid
    IF v_current_status = 'complete' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: This violation has already been paid';
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
    
    -- Get violation details for response
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
        sh.compliance_status
    FROM violation_report vr
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    WHERE vr.report_id = p_report_id;
    
END$$

DELIMITER ;

-- Step 4: Create stored procedure to get unpaid violations for a stallholder
DELIMITER $$

DROP PROCEDURE IF EXISTS `getUnpaidViolationsByStallholder`$$

CREATE PROCEDURE `getUnpaidViolationsByStallholder`(
    IN `p_stallholder_id` INT
)
BEGIN
    SELECT 
        vr.report_id AS violation_id,
        vr.date_reported,
        COALESCE(vr.compliance_type, v.violation_type) AS violation_type,
        v.ordinance_no,
        vr.offense_no,
        vr.severity,
        vr.status,
        vr.receipt_number,
        vp.penalty_amount,
        vp.remarks AS penalty_remarks,
        CONCAT(i.first_name, ' ', i.last_name) AS inspector_name,
        b.branch_name,
        s.stall_no,
        vr.stallholder_id
    FROM violation_report vr
    LEFT JOIN violation v ON vr.violation_id = v.violation_id
    LEFT JOIN violation_penalty vp ON vr.penalty_id = vp.penalty_id
    LEFT JOIN inspector i ON vr.inspector_id = i.inspector_id
    LEFT JOIN branch b ON vr.branch_id = b.branch_id
    LEFT JOIN stall s ON vr.stall_id = s.stall_id
    WHERE vr.stallholder_id = p_stallholder_id
      AND vr.status != 'complete'
    ORDER BY vr.date_reported DESC;
END$$

DELIMITER ;
