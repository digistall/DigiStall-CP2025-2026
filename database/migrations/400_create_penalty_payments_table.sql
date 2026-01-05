-- Migration: 400_create_penalty_payments_table.sql
-- Description: Create separate penalty_payments table for violation penalty payments
-- Date: January 5, 2026
-- This separates penalty payments from regular rental/utility payments

-- Step 1: Create the penalty_payments table
CREATE TABLE IF NOT EXISTS `penalty_payments` (
  `penalty_payment_id` INT(11) NOT NULL AUTO_INCREMENT,
  `report_id` INT(11) NOT NULL COMMENT 'Reference to violation_report',
  `stallholder_id` INT(11) NOT NULL,
  `violation_id` INT(11) DEFAULT NULL,
  `penalty_id` INT(11) DEFAULT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `payment_date` DATE NOT NULL,
  `payment_time` TIME DEFAULT NULL,
  `payment_method` ENUM('cash','gcash','maya','paymaya','bank_transfer','check','onsite') NOT NULL DEFAULT 'onsite',
  `reference_number` VARCHAR(100) DEFAULT NULL COMMENT 'Receipt number or transaction ID',
  `collected_by` VARCHAR(255) DEFAULT NULL COMMENT 'Who collected the payment',
  `payment_status` ENUM('pending','completed','failed','cancelled') DEFAULT 'completed',
  `notes` TEXT DEFAULT NULL,
  `branch_id` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`penalty_payment_id`),
  INDEX `idx_penalty_report_id` (`report_id`),
  INDEX `idx_penalty_stallholder_id` (`stallholder_id`),
  INDEX `idx_penalty_payment_date` (`payment_date`),
  INDEX `idx_penalty_branch_id` (`branch_id`),
  CONSTRAINT `fk_penalty_payment_report` FOREIGN KEY (`report_id`) 
    REFERENCES `violation_report` (`report_id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_penalty_payment_stallholder` FOREIGN KEY (`stallholder_id`) 
    REFERENCES `stallholder` (`stallholder_id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Step 2: Update the processViolationPayment procedure to insert into penalty_payments instead of payments
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
    DECLARE v_violation_id INT;
    DECLARE v_penalty_id INT;
    DECLARE v_violation_type VARCHAR(255);
    DECLARE v_unpaid_count INT;
    DECLARE v_payment_notes TEXT;
    
    -- Check if violation report exists
    IF NOT EXISTS (SELECT 1 FROM violation_report WHERE report_id = p_report_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error: Violation report not found';
    END IF;
    
    -- Get current status, stallholder_id, branch_id, violation_id, and penalty_id
    SELECT status, stallholder_id, branch_id, violation_id, penalty_id 
    INTO v_current_status, v_stallholder_id, v_branch_id, v_violation_id, v_penalty_id
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
    
    -- Insert into penalty_payments table (NOT payments table)
    INSERT INTO penalty_payments (
        report_id,
        stallholder_id,
        violation_id,
        penalty_id,
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
        v_penalty_id,
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
    AND status != 'complete';
    
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
END$$

DELIMITER ;

-- Step 3: Create a stored procedure to get penalty payments
DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getPenaltyPayments`$$

CREATE PROCEDURE `sp_getPenaltyPayments`(
    IN `p_branch_id` INT,
    IN `p_limit` INT,
    IN `p_offset` INT
)
BEGIN
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
        pp.collected_by,
        pp.payment_status,
        pp.notes,
        pp.branch_id,
        pp.created_at,
        CONCAT(s.stallholder_fname, ' ', COALESCE(s.stallholder_mname, ''), ' ', s.stallholder_lname) as stallholder_name,
        v.violation_type,
        v.ordinance_no,
        vr.offense_no,
        vr.receipt_number as violation_receipt_number,
        b.branch_name
    FROM penalty_payments pp
    LEFT JOIN stallholder s ON pp.stallholder_id = s.stallholder_id
    LEFT JOIN violation v ON pp.violation_id = v.violation_id
    LEFT JOIN violation_report vr ON pp.report_id = vr.report_id
    LEFT JOIN branch b ON pp.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR pp.branch_id = p_branch_id)
    ORDER BY pp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END$$

DELIMITER ;

-- Step 4: Create procedure to get penalty payments count
DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getPenaltyPaymentsCount`$$

CREATE PROCEDURE `sp_getPenaltyPaymentsCount`(
    IN `p_branch_id` INT
)
BEGIN
    SELECT COUNT(*) as total_count
    FROM penalty_payments pp
    WHERE (p_branch_id IS NULL OR pp.branch_id = p_branch_id);
END$$

DELIMITER ;

-- Step 5: Migrate existing penalty payments from payments table to penalty_payments
-- This moves any existing penalty-type payments to the new table
INSERT INTO penalty_payments (
    report_id,
    stallholder_id,
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
)
SELECT 
    NULL, -- report_id will be null for old records
    p.stallholder_id,
    p.amount,
    p.payment_date,
    p.payment_time,
    p.payment_method,
    p.reference_number,
    p.collected_by,
    p.payment_status,
    p.notes,
    p.branch_id,
    p.created_at
FROM payments p
WHERE p.payment_type = 'penalty'
ON DUPLICATE KEY UPDATE penalty_payment_id = penalty_payment_id;

-- Step 6: Remove penalty type payments from the payments table (keep only regular payments)
DELETE FROM payments WHERE payment_type = 'penalty';
