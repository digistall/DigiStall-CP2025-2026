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
    
    -- Get current status, stallholder_id, violation_id from violation_report
    SELECT vr.status, vr.stallholder_id, vr.violation_id, sh.branch_id
    INTO v_current_status, v_stallholder_id, v_violation_id, v_branch_id
    FROM violation_report vr
    LEFT JOIN stallholder sh ON vr.stallholder_id = sh.stallholder_id
    WHERE vr.report_id = p_report_id;
    
    -- Check if already paid
    IF v_current_status = 'Resolved' OR v_current_status = 'complete' THEN
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
    AND status != 'Resolved' 
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
        s.full_name as stallholder_name,
        s.compliance_status,
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
    COALESCE(s.full_name, vr.violator_name, 'Unknown') AS stallholder_name,
    s.compliance_status AS compliance_status,
    
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
