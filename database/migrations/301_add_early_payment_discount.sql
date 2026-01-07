-- =====================================================
-- Migration: 301_add_early_payment_discount.sql
-- Description: Update addOnsitePayment procedure to include 25% early payment discount
-- Date: 2025-12-22
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `addOnsitePayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addOnsitePayment` (
    IN `p_stallholder_id` INT, 
    IN `p_amount` DECIMAL(10,2), 
    IN `p_payment_date` DATE, 
    IN `p_payment_time` TIME, 
    IN `p_payment_for_month` VARCHAR(7), 
    IN `p_payment_type` VARCHAR(50), 
    IN `p_reference_number` VARCHAR(100), 
    IN `p_collected_by` VARCHAR(100), 
    IN `p_notes` TEXT, 
    IN `p_branch_id` INT, 
    IN `p_created_by` INT
) 
BEGIN
    DECLARE payment_id INT;
    DECLARE v_days_overdue INT DEFAULT 0;
    DECLARE v_days_early INT DEFAULT 0;
    DECLARE v_late_fee DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_early_discount DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_last_payment_date DATE;
    DECLARE v_monthly_rent DECIMAL(10,2);
    DECLARE v_contract_start_date DATE;
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE v_notes TEXT;
    DECLARE v_due_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Payment processing failed' as message;
    END;
    
    START TRANSACTION;
    
    -- Get stallholder information
    SELECT last_payment_date, monthly_rent, contract_start_date
    INTO v_last_payment_date, v_monthly_rent, v_contract_start_date
    FROM stallholder
    WHERE stallholder_id = p_stallholder_id;
    
    -- Calculate due date (30 days after last payment or contract start)
    IF v_last_payment_date IS NOT NULL THEN
        SET v_due_date = DATE_ADD(v_last_payment_date, INTERVAL 30 DAY);
    ELSEIF v_contract_start_date IS NOT NULL THEN
        -- First payment: due date is 30 days after contract start
        SET v_due_date = DATE_ADD(v_contract_start_date, INTERVAL 30 DAY);
    ELSE
        -- No contract start date: assume due date is today (no early discount for new stallholders without dates)
        SET v_due_date = CURDATE();
    END IF;
    
    -- Calculate if payment is early or late
    SET v_days_early = DATEDIFF(v_due_date, p_payment_date);
    
    IF v_days_early > 0 THEN
        -- EARLY PAYMENT: Apply 25% discount
        -- Discount is only applied if paid 5+ days before due date
        IF v_days_early >= 5 THEN
            SET v_early_discount = v_monthly_rent * 0.25;
            SET v_total_amount = v_monthly_rent - v_early_discount;
        ELSE
            -- Less than 5 days early, no discount
            SET v_total_amount = v_monthly_rent;
        END IF;
        SET v_days_overdue = 0;
        SET v_late_fee = 0.00;
    ELSE
        -- LATE OR ON-TIME PAYMENT
        SET v_days_overdue = ABS(v_days_early);
        
        -- Calculate late fee (₱100 per month overdue)
        IF v_days_overdue > 0 THEN
            SET v_late_fee = CEILING(v_days_overdue / 30) * 100.00;
        END IF;
        
        SET v_total_amount = v_monthly_rent + v_late_fee;
        SET v_early_discount = 0.00;
    END IF;
    
    -- Build notes with discount/late fee information
    SET v_notes = p_notes;
    
    IF v_early_discount > 0 THEN
        SET v_notes = CONCAT(
            COALESCE(p_notes, ''),
            IF(p_notes IS NOT NULL AND p_notes != '', ' | ', ''),
            '✅ Early Payment Discount (25%): -₱', FORMAT(v_early_discount, 2),
            ' (Paid ', v_days_early, ' days before due date: ', DATE_FORMAT(v_due_date, '%Y-%m-%d'), ')',
            ' | Original: ₱', FORMAT(v_monthly_rent, 2),
            ' → Discounted: ₱', FORMAT(v_total_amount, 2)
        );
    END IF;
    
    IF v_late_fee > 0 THEN
        SET v_notes = CONCAT(
            COALESCE(p_notes, ''),
            IF(p_notes IS NOT NULL AND p_notes != '', ' | ', ''),
            '⚠️ Late Fee: +₱', FORMAT(v_late_fee, 2),
            ' (', v_days_overdue, ' days overdue from due date: ', DATE_FORMAT(v_due_date, '%Y-%m-%d'), ')'
        );
    END IF;
    
    -- Insert payment record
    INSERT INTO payments (
        stallholder_id, amount, payment_date, payment_time, payment_for_month,
        payment_type, payment_method, reference_number, collected_by, notes,
        payment_status, branch_id, created_by, created_at, updated_at
    ) VALUES (
        p_stallholder_id, v_total_amount, p_payment_date, p_payment_time, p_payment_for_month,
        p_payment_type, 'onsite', p_reference_number, p_collected_by, v_notes,
        'completed', p_branch_id, p_created_by, NOW(), NOW()
    );
    
    SET payment_id = LAST_INSERT_ID();
    
    -- Update stallholder payment status
    UPDATE stallholder
    SET last_payment_date = p_payment_date,
        payment_status = 'paid',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    -- Return success with discount/late fee information
    SELECT 
        1 as success,
        payment_id,
        v_total_amount as amount_paid,
        v_monthly_rent as monthly_rent,
        v_early_discount as early_discount,
        v_late_fee as late_fee,
        v_days_early as days_early,
        v_days_overdue as days_overdue,
        v_due_date as due_date,
        CASE 
            WHEN v_early_discount > 0 THEN CONCAT('✅ Payment recorded with 25% early payment discount! Saved ₱', FORMAT(v_early_discount, 2))
            WHEN v_late_fee > 0 THEN CONCAT('⚠️ Payment recorded with late fee of ₱', FORMAT(v_late_fee, 2))
            ELSE '✓ Payment recorded successfully'
        END as message;
END$$

DELIMITER ;

-- Test the updated procedure
SELECT 'Migration 301: Early payment discount added to addOnsitePayment procedure' as Status;
