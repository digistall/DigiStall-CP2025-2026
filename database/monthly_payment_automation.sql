-- =====================================================
-- MONTHLY PAYMENT AUTOMATION FEATURE
-- =====================================================
-- This script implements automatic monthly payment status management:
-- 1. Adds 'paid' and 'pending' status to payment_status enum
-- 2. Updates addOnsitePayment to set status to 'paid' after payment
-- 3. Filters stallholder dropdown to hide 'paid' stallholders
-- 4. Creates monthly event to reset 'paid' to 'pending' on 1st of month
-- 5. Keeps ₱100/month overdue fee calculation
-- =====================================================

USE naga_stall;

-- =====================================================
-- STEP 1: Alter stallholder table payment_status enum
-- =====================================================
-- Add 'paid' and 'pending' to existing enum values
ALTER TABLE `stallholder` 
MODIFY COLUMN `payment_status` ENUM(
    'current',
    'overdue', 
    'grace_period',
    'paid',
    'pending'
) DEFAULT 'pending';

-- =====================================================
-- STEP 2: Update addOnsitePayment Procedure
-- =====================================================
-- Change status update from 'current' to 'paid' when payment is made
-- Keep the ₱100/month overdue fee calculation logic
DROP PROCEDURE IF EXISTS `addOnsitePayment`;

DELIMITER $$

CREATE PROCEDURE `addOnsitePayment` (
    IN p_stallholder_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_date DATE,
    IN p_payment_time TIME,
    IN p_payment_for_month VARCHAR(7),
    IN p_payment_type VARCHAR(50),
    IN p_reference_number VARCHAR(100),
    IN p_collected_by VARCHAR(100),
    IN p_notes TEXT,
    IN p_branch_id INT,
    IN p_created_by INT
)
BEGIN
    DECLARE payment_id INT;
    DECLARE v_days_overdue INT DEFAULT 0;
    DECLARE v_late_fee DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_last_payment_date DATE;
    DECLARE v_monthly_rent DECIMAL(10,2);
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_notes TEXT;
    
    -- Error handler
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Payment processing failed' as message;
    END;
    
    START TRANSACTION;
    
    -- Get stallholder payment info
    SELECT last_payment_date, monthly_rent
    INTO v_last_payment_date, v_monthly_rent
    FROM stallholder
    WHERE stallholder_id = p_stallholder_id;
    
    -- Calculate days overdue if there was a previous payment
    IF v_last_payment_date IS NOT NULL THEN
        SET v_days_overdue = DATEDIFF(p_payment_date, v_last_payment_date) - 30;
        IF v_days_overdue < 0 THEN
            SET v_days_overdue = 0;
        END IF;
    END IF;
    
    -- Calculate late fee: ₱100 per month overdue
    IF v_days_overdue > 0 THEN
        SET v_late_fee = CEILING(v_days_overdue / 30) * 100.00;
    END IF;
    
    -- Calculate total amount (payment + late fee)
    SET v_total_amount = p_amount + v_late_fee;
    
    -- Build notes with late fee info if applicable
    SET v_notes = p_notes;
    IF v_late_fee > 0 THEN
        SET v_notes = CONCAT(
            COALESCE(p_notes, ''),
            IF(p_notes IS NOT NULL AND p_notes != '', ' | ', ''),
            'Late Fee: ₱', FORMAT(v_late_fee, 2),
            ' (', v_days_overdue, ' days overdue)'
        );
    END IF;
    
    -- Insert payment record
    INSERT INTO payments (
        stallholder_id,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        payment_method,
        reference_number,
        collected_by,
        notes,
        payment_status,
        branch_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_stallholder_id,
        v_total_amount,
        p_payment_date,
        p_payment_time,
        p_payment_for_month,
        p_payment_type,
        'onsite',
        p_reference_number,
        p_collected_by,
        v_notes,
        'completed',
        p_branch_id,
        p_created_by,
        NOW(),
        NOW()
    );
    
    SET payment_id = LAST_INSERT_ID();
    
    -- Update stallholder status to 'paid' (was 'current' before)
    -- This will hide them from the stallholder dropdown
    UPDATE stallholder
    SET last_payment_date = p_payment_date,
        payment_status = 'paid',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    -- Return payment details with late fee information
    SELECT 
        1 as success,
        payment_id,
        v_total_amount as amount_paid,
        v_late_fee as late_fee,
        v_days_overdue as days_overdue,
        'Payment recorded successfully. Stallholder status updated to PAID.' as message;
END$$

DELIMITER ;

-- =====================================================
-- STEP 3: Update sp_get_all_stallholders
-- =====================================================
-- Filter out stallholders with 'paid' status so they don't appear in dropdown
DROP PROCEDURE IF EXISTS `sp_get_all_stallholders`;

DELIMITER $$

CREATE PROCEDURE `sp_get_all_stallholders` (IN p_branch_id INT)
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.payment_status as paymentStatus
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
      AND sh.contract_status = 'Active'
      AND sh.payment_status != 'paid'  -- NEW: Hide stallholders who already paid
    ORDER BY sh.stallholder_name ASC;
END$$

DELIMITER ;

-- =====================================================
-- STEP 4: Create Monthly Auto-Reset Event
-- =====================================================
-- This event runs on the 1st of every month at 12:01 AM
-- It changes all 'paid' statuses to 'pending' so stallholders
-- reappear in the dropdown for the new month's payment

-- First, enable the event scheduler (if not already enabled)
SET GLOBAL event_scheduler = ON;

-- Drop existing event if exists
DROP EVENT IF EXISTS `reset_monthly_payment_status`;

-- Create the monthly reset event
DELIMITER $$

CREATE EVENT `reset_monthly_payment_status`
ON SCHEDULE 
    EVERY 1 MONTH
    STARTS CONCAT(DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m'), '-01 00:01:00')
    -- This starts on the 1st of next month at 12:01 AM
    -- Example: if today is Nov 18, it will first run on Dec 1 at 12:01 AM
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Resets stallholder payment status from paid to pending on the 1st of every month'
DO
BEGIN
    -- Reset all 'paid' statuses to 'pending'
    UPDATE stallholder
    SET payment_status = 'pending',
        updated_at = NOW()
    WHERE payment_status = 'paid'
      AND contract_status = 'Active';
    
    -- Log the reset action (optional, for tracking)
    -- You can create a payment_status_log table to track these automatic resets
END$$

DELIMITER ;

-- =====================================================
-- STEP 5: Create Payment Status Log Table (Optional)
-- =====================================================
-- This table tracks automatic status resets for auditing
CREATE TABLE IF NOT EXISTS `payment_status_log` (
    `log_id` INT AUTO_INCREMENT PRIMARY KEY,
    `reset_date` DATE NOT NULL,
    `stallholders_reset_count` INT DEFAULT 0,
    `reset_type` ENUM('manual', 'automatic') DEFAULT 'automatic',
    `notes` TEXT,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================
-- STEP 6: Enhanced Event with Logging
-- =====================================================
DROP EVENT IF EXISTS `reset_monthly_payment_status`;

DELIMITER $$

CREATE EVENT `reset_monthly_payment_status`
ON SCHEDULE 
    EVERY 1 MONTH
    STARTS CONCAT(DATE_FORMAT(DATE_ADD(NOW(), INTERVAL 1 MONTH), '%Y-%m'), '-01 00:01:00')
ON COMPLETION PRESERVE
ENABLE
COMMENT 'Resets stallholder payment status from paid to pending on the 1st of every month'
DO
BEGIN
    DECLARE reset_count INT DEFAULT 0;
    
    -- Count how many will be reset
    SELECT COUNT(*) INTO reset_count
    FROM stallholder
    WHERE payment_status = 'paid'
      AND contract_status = 'Active';
    
    -- Reset all 'paid' statuses to 'pending'
    UPDATE stallholder
    SET payment_status = 'pending',
        updated_at = NOW()
    WHERE payment_status = 'paid'
      AND contract_status = 'Active';
    
    -- Log the reset
    INSERT INTO payment_status_log (
        reset_date,
        stallholders_reset_count,
        reset_type,
        notes
    ) VALUES (
        CURDATE(),
        reset_count,
        'automatic',
        CONCAT('Monthly automatic reset on ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
    );
END$$

DELIMITER ;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check current stallholder payment statuses
SELECT 
    payment_status,
    COUNT(*) as count
FROM stallholder
WHERE contract_status = 'Active'
GROUP BY payment_status;

-- View the scheduled event
SHOW EVENTS WHERE Name = 'reset_monthly_payment_status';

-- Check event scheduler status
SHOW VARIABLES LIKE 'event_scheduler';

-- =====================================================
-- MANUAL TESTING HELPER PROCEDURES
-- =====================================================

-- Procedure to manually trigger monthly reset (for testing)
DROP PROCEDURE IF EXISTS `manual_reset_payment_status`;

DELIMITER $$

CREATE PROCEDURE `manual_reset_payment_status`()
BEGIN
    DECLARE reset_count INT DEFAULT 0;
    
    SELECT COUNT(*) INTO reset_count
    FROM stallholder
    WHERE payment_status = 'paid'
      AND contract_status = 'Active';
    
    UPDATE stallholder
    SET payment_status = 'pending',
        updated_at = NOW()
    WHERE payment_status = 'paid'
      AND contract_status = 'Active';
    
    INSERT INTO payment_status_log (
        reset_date,
        stallholders_reset_count,
        reset_type,
        notes
    ) VALUES (
        CURDATE(),
        reset_count,
        'manual',
        CONCAT('Manual reset by admin on ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
    );
    
    SELECT 
        reset_count as stallholders_reset,
        'Payment statuses reset from paid to pending' as message;
END$$

DELIMITER ;

-- =====================================================
-- SUMMARY OF CHANGES
-- =====================================================
/*
1. ✅ Updated payment_status enum to include 'paid' and 'pending'
2. ✅ Modified addOnsitePayment to set status to 'paid' (instead of 'current')
3. ✅ Updated sp_get_all_stallholders to filter out 'paid' stallholders
4. ✅ Created monthly event to auto-reset 'paid' to 'pending' on 1st of month
5. ✅ Added payment_status_log table for tracking resets
6. ✅ Created manual_reset_payment_status procedure for testing

WORKFLOW:
- Stallholder with 'pending' status appears in dropdown
- When they pay, status changes to 'paid'
- They disappear from dropdown (can't pay twice)
- On 1st of next month, status auto-resets to 'pending'
- They reappear in dropdown for next month's payment
- If they don't pay and become overdue, ₱100/month late fee applies

TO TEST MANUALLY:
1. CALL manual_reset_payment_status(); -- Resets all 'paid' to 'pending'
2. SELECT * FROM payment_status_log; -- View reset history
3. SELECT * FROM stallholder WHERE payment_status = 'paid'; -- Check paid stallholders
*/
