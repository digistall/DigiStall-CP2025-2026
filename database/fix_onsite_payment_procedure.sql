-- Enhanced Onsite Payment Stored Procedure
-- This procedure adds payment, updates stallholder status, and handles late fees

DROP PROCEDURE IF EXISTS `addOnsitePayment`;

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
    DECLARE v_monthly_rent DECIMAL(10,2);
    DECLARE v_last_payment_date DATE;
    DECLARE v_payment_status VARCHAR(20);
    DECLARE v_days_overdue INT;
    DECLARE v_late_fee DECIMAL(10,2) DEFAULT 0.00;
    DECLARE v_total_amount DECIMAL(10,2);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Payment failed. Please try again.' as message;
    END;
    
    START TRANSACTION;
    
    -- Get stallholder information
    SELECT 
        monthly_rent,
        last_payment_date
    INTO 
        v_monthly_rent,
        v_last_payment_date
    FROM stallholder
    WHERE stallholder_id = p_stallholder_id
    AND contract_status = 'Active';
    
    -- Check if stallholder exists
    IF v_monthly_rent IS NULL THEN
        ROLLBACK;
        SELECT 0 as success, 'Stallholder not found or contract is not active' as message;
    ELSE
        -- Calculate days overdue if last payment exists
        IF v_last_payment_date IS NOT NULL THEN
            -- Calculate days from last payment date to current payment date
            SET v_days_overdue = DATEDIFF(p_payment_date, DATE_ADD(v_last_payment_date, INTERVAL 1 MONTH));
            
            -- If payment is late (more than 30 days from last payment), add late fee
            IF v_days_overdue > 0 THEN
                -- 100 pesos late fee per month overdue
                SET v_late_fee = CEILING(v_days_overdue / 30) * 100.00;
            END IF;
        END IF;
        
        -- Calculate total amount (amount paid should include late fee if applicable)
        SET v_total_amount = p_amount;
        
        -- Insert payment record
        INSERT INTO payments (
            stallholder_id,
            amount,
            payment_date,
            payment_time,
            payment_for_month,
            payment_type,
            payment_method,
            payment_status,
            reference_number,
            collected_by,
            notes,
            branch_id,
            created_by,
            created_at
        ) VALUES (
            p_stallholder_id,
            v_total_amount,
            p_payment_date,
            p_payment_time,
            p_payment_for_month,
            p_payment_type,
            'onsite',
            'completed',
            p_reference_number,
            p_collected_by,
            CONCAT(
                COALESCE(p_notes, ''),
                IF(v_late_fee > 0, 
                   CONCAT(' | Late Fee: ₱', FORMAT(v_late_fee, 2), ' (', v_days_overdue, ' days overdue)'),
                   ''
                )
            ),
            p_branch_id,
            p_created_by,
            NOW()
        );
        
        SET payment_id = LAST_INSERT_ID();
        
        -- Update stallholder payment status
        -- Determine new payment status based on payment date
        IF p_payment_date >= DATE_SUB(CURDATE(), INTERVAL 5 DAY) THEN
            SET v_payment_status = 'current';
        ELSEIF p_payment_date >= DATE_SUB(CURDATE(), INTERVAL 30 DAY) THEN
            SET v_payment_status = 'grace_period';
        ELSE
            SET v_payment_status = 'overdue';
        END IF;
        
        -- Update stallholder record
        UPDATE stallholder
        SET 
            last_payment_date = p_payment_date,
            payment_status = 'current',  -- Always set to current when payment is made
            updated_at = NOW()
        WHERE stallholder_id = p_stallholder_id;
        
        COMMIT;
        
        -- Return success with payment details
        SELECT 
            1 as success, 
            'Payment added successfully' as message,
            payment_id as payment_id,
            v_total_amount as amount_paid,
            v_late_fee as late_fee,
            v_days_overdue as days_overdue,
            p_reference_number as receipt_number;
    END IF;
END;
