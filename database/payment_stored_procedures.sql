-- ============================================================================
-- PAYMENT MANAGEMENT STORED PROCEDURES
-- Created for DigiStall Payment System
-- ============================================================================

DELIMITER $$

-- ============================================================================
-- 1. GET ALL PAYMENTS WITH STALLHOLDER DETAILS
-- ============================================================================
DROP PROCEDURE IF EXISTS `getAllPaymentsDetailed`$$
CREATE PROCEDURE `getAllPaymentsDetailed`(
    IN `p_branch_id` INT,
    IN `p_payment_method` VARCHAR(20),
    IN `p_payment_status` VARCHAR(20),
    IN `p_start_date` DATE,
    IN `p_end_date` DATE,
    IN `p_limit` INT,
    IN `p_offset` INT
)
BEGIN
    SET @sql = 'SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_method,
        p.payment_status,
        p.payment_type,
        p.payment_for_month,
        p.reference_number,
        p.collected_by,
        p.notes,
        p.created_at,
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.business_name,
        sh.monthly_rent,
        COALESCE(st.stall_no, "N/A") as stall_no,
        COALESCE(st.stall_location, "N/A") as stall_location,
        COALESCE(b.branch_name, "Unknown") as branch_name,
        COALESCE(b.area, "Unknown") as area
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE 1=1';
    
    -- Add filters
    IF p_branch_id IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND sh.branch_id = ', p_branch_id);
    END IF;
    
    IF p_payment_method IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND p.payment_method = "', p_payment_method, '"');
    END IF;
    
    IF p_payment_status IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND p.payment_status = "', p_payment_status, '"');
    END IF;
    
    IF p_start_date IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND p.payment_date >= "', p_start_date, '"');
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND p.payment_date <= "', p_end_date, '"');
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY p.payment_date DESC, p.created_at DESC');
    
    -- Add pagination
    IF p_limit IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', p_limit);
        IF p_offset IS NOT NULL THEN
            SET @sql = CONCAT(@sql, ' OFFSET ', p_offset);
        END IF;
    END IF;
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

-- ============================================================================
-- 2. ADD ONSITE PAYMENT
-- ============================================================================
DROP PROCEDURE IF EXISTS `addOnsitePayment`$$
CREATE PROCEDURE `addOnsitePayment`(
    IN `p_stallholder_id` INT,
    IN `p_amount` DECIMAL(10,2),
    IN `p_payment_date` DATE,
    IN `p_payment_time` TIME,
    IN `p_payment_for_month` VARCHAR(7),
    IN `p_payment_type` ENUM('rental','penalty','deposit','maintenance','other'),
    IN `p_reference_number` VARCHAR(100),
    IN `p_collected_by` VARCHAR(100),
    IN `p_notes` TEXT,
    IN `p_created_by` INT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Validate stallholder exists
    IF NOT EXISTS (SELECT 1 FROM stallholder WHERE stallholder_id = p_stallholder_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stallholder not found';
    END IF;
    
    -- Insert payment record
    INSERT INTO payments (
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        created_by,
        created_at
    ) VALUES (
        p_stallholder_id,
        'onsite',
        p_amount,
        COALESCE(p_payment_date, CURDATE()),
        COALESCE(p_payment_time, CURTIME()),
        p_payment_for_month,
        COALESCE(p_payment_type, 'rental'),
        p_reference_number,
        p_collected_by,
        'completed',
        p_notes,
        p_created_by,
        NOW()
    );
    
    SET @payment_id = LAST_INSERT_ID();
    
    -- Update stallholder last payment date
    UPDATE stallholder 
    SET last_payment_date = COALESCE(p_payment_date, CURDATE()),
        payment_status = 'current',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    SELECT 1 as success, 'Onsite payment recorded successfully' AS message, @payment_id as payment_id;
END$$

-- ============================================================================
-- 3. PROCESS ONLINE PAYMENT
-- ============================================================================
DROP PROCEDURE IF EXISTS `processOnlinePayment`$$
CREATE PROCEDURE `processOnlinePayment`(
    IN `p_stallholder_id` INT,
    IN `p_amount` DECIMAL(10,2),
    IN `p_payment_date` DATE,
    IN `p_payment_time` TIME,
    IN `p_payment_for_month` VARCHAR(7),
    IN `p_payment_type` ENUM('rental','penalty','deposit','maintenance','other'),
    IN `p_reference_number` VARCHAR(100),
    IN `p_payment_gateway` VARCHAR(50),
    IN `p_transaction_id` VARCHAR(100),
    IN `p_notes` TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Validate stallholder exists
    IF NOT EXISTS (SELECT 1 FROM stallholder WHERE stallholder_id = p_stallholder_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stallholder not found';
    END IF;
    
    -- Insert payment record
    INSERT INTO payments (
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        created_at
    ) VALUES (
        p_stallholder_id,
        'online',
        p_amount,
        COALESCE(p_payment_date, CURDATE()),
        COALESCE(p_payment_time, CURTIME()),
        p_payment_for_month,
        COALESCE(p_payment_type, 'rental'),
        p_reference_number,
        CONCAT(p_payment_gateway, ' - ', p_transaction_id),
        'completed',
        CONCAT(COALESCE(p_notes, ''), ' | Gateway: ', p_payment_gateway, ' | TX ID: ', p_transaction_id),
        NOW()
    );
    
    SET @payment_id = LAST_INSERT_ID();
    
    -- Update stallholder last payment date
    UPDATE stallholder 
    SET last_payment_date = COALESCE(p_payment_date, CURDATE()),
        payment_status = 'current',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    SELECT 1 as success, 'Online payment processed successfully' AS message, @payment_id as payment_id;
END$$

-- ============================================================================
-- 4. ACCEPT ONLINE PAYMENT (ADMIN APPROVAL)
-- ============================================================================
DROP PROCEDURE IF EXISTS `acceptOnlinePayment`$$
CREATE PROCEDURE `acceptOnlinePayment`(
    IN `p_payment_id` INT,
    IN `p_approved_by` INT,
    IN `p_approval_notes` TEXT
)
BEGIN
    DECLARE v_stallholder_id INT;
    DECLARE v_payment_date DATE;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Get payment details
    SELECT stallholder_id, payment_date
    INTO v_stallholder_id, v_payment_date
    FROM payments 
    WHERE payment_id = p_payment_id AND payment_status = 'pending';
    
    IF v_stallholder_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not found or already processed';
    END IF;
    
    -- Update payment status
    UPDATE payments 
    SET payment_status = 'completed',
        notes = CONCAT(COALESCE(notes, ''), ' | Approved by manager on ', NOW(), ' | ', COALESCE(p_approval_notes, '')),
        updated_at = NOW()
    WHERE payment_id = p_payment_id;
    
    -- Update stallholder status
    UPDATE stallholder 
    SET last_payment_date = v_payment_date,
        payment_status = 'current',
        updated_at = NOW()
    WHERE stallholder_id = v_stallholder_id;
    
    COMMIT;
    
    SELECT 1 as success, 'Payment accepted successfully' AS message;
END$$

-- ============================================================================
-- 5. DECLINE ONLINE PAYMENT
-- ============================================================================
DROP PROCEDURE IF EXISTS `declineOnlinePayment`$$
CREATE PROCEDURE `declineOnlinePayment`(
    IN `p_payment_id` INT,
    IN `p_declined_by` INT,
    IN `p_decline_reason` TEXT
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Validate payment exists and is pending
    IF NOT EXISTS (SELECT 1 FROM payments WHERE payment_id = p_payment_id AND payment_status = 'pending') THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not found or already processed';
    END IF;
    
    -- Update payment status
    UPDATE payments 
    SET payment_status = 'cancelled',
        notes = CONCAT(COALESCE(notes, ''), ' | Declined by manager on ', NOW(), ' | Reason: ', COALESCE(p_decline_reason, 'Not specified')),
        updated_at = NOW()
    WHERE payment_id = p_payment_id;
    
    COMMIT;
    
    SELECT 1 as success, 'Payment declined successfully' AS message;
END$$

-- ============================================================================
-- 6. GET PAYMENT SUMMARY BY BRANCH
-- ============================================================================
DROP PROCEDURE IF EXISTS `getPaymentSummaryByBranch`$$
CREATE PROCEDURE `getPaymentSummaryByBranch`(
    IN `p_branch_id` INT,
    IN `p_start_date` DATE,
    IN `p_end_date` DATE
)
BEGIN
    SELECT 
        b.branch_id,
        b.branch_name,
        b.area,
        COUNT(p.payment_id) as total_payments,
        SUM(p.amount) as total_amount,
        SUM(CASE WHEN p.payment_method = 'onsite' THEN p.amount ELSE 0 END) as onsite_amount,
        SUM(CASE WHEN p.payment_method = 'online' THEN p.amount ELSE 0 END) as online_amount,
        SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN p.amount ELSE 0 END) as bank_transfer_amount,
        COUNT(CASE WHEN p.payment_method = 'onsite' THEN 1 END) as onsite_count,
        COUNT(CASE WHEN p.payment_method = 'online' THEN 1 END) as online_count,
        COUNT(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 END) as bank_transfer_count,
        COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pending_payments,
        AVG(p.amount) as average_payment
    FROM branch b
    LEFT JOIN stallholder sh ON b.branch_id = sh.branch_id
    LEFT JOIN payments p ON sh.stallholder_id = p.stallholder_id
        AND p.payment_date BETWEEN COALESCE(p_start_date, '2020-01-01') AND COALESCE(p_end_date, CURDATE())
    WHERE (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    GROUP BY b.branch_id, b.branch_name, b.area
    HAVING (p_branch_id IS NULL OR b.branch_id = p_branch_id)
    ORDER BY total_amount DESC;
END$$

-- ============================================================================
-- 7. GET STALLHOLDER PAYMENT HISTORY
-- ============================================================================
DROP PROCEDURE IF EXISTS `getStallholderPaymentHistory`$$
CREATE PROCEDURE `getStallholderPaymentHistory`(
    IN `p_stallholder_id` INT,
    IN `p_limit` INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_method,
        p.payment_status,
        p.payment_type,
        p.payment_for_month,
        p.reference_number,
        p.collected_by,
        p.notes,
        p.created_at,
        sh.stallholder_name,
        sh.monthly_rent,
        CASE 
            WHEN p.payment_method = 'onsite' THEN 'Cash Payment at Office'
            WHEN p.payment_method = 'online' THEN 'Online Payment'
            WHEN p.payment_method = 'bank_transfer' THEN 'Bank Transfer'
            WHEN p.payment_method = 'check' THEN 'Check Payment'
            ELSE 'Other'
        END as payment_method_display
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC, p.created_at DESC
    LIMIT COALESCE(p_limit, 50);
END$$

-- ============================================================================
-- 8. GET PENDING ONLINE PAYMENTS
-- ============================================================================
DROP PROCEDURE IF EXISTS `getPendingOnlinePayments`$$
CREATE PROCEDURE `getPendingOnlinePayments`(
    IN `p_branch_id` INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.reference_number,
        p.notes,
        p.created_at,
        sh.stallholder_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.business_name,
        COALESCE(st.stall_no, 'N/A') as stall_no,
        COALESCE(b.branch_name, 'Unknown') as branch_name,
        DATEDIFF(NOW(), p.created_at) as days_pending
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE p.payment_status = 'pending' 
      AND p.payment_method = 'online'
      AND (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
    ORDER BY p.created_at ASC;
END$$

-- ============================================================================
-- 9. GET PAYMENT STATISTICS
-- ============================================================================
DROP PROCEDURE IF EXISTS `getPaymentStatistics`$$
CREATE PROCEDURE `getPaymentStatistics`(
    IN `p_branch_id` INT,
    IN `p_year` INT,
    IN `p_month` INT
)
BEGIN
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    
    IF p_month IS NOT NULL THEN
        SET v_start_date = DATE(CONCAT(p_year, '-', LPAD(p_month, 2, '0'), '-01'));
        SET v_end_date = LAST_DAY(v_start_date);
    ELSE
        SET v_start_date = DATE(CONCAT(p_year, '-01-01'));
        SET v_end_date = DATE(CONCAT(p_year, '-12-31'));
    END IF;
    
    SELECT 
        'Summary' as category,
        COUNT(*) as total_transactions,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount,
        MIN(p.amount) as minimum_amount,
        MAX(p.amount) as maximum_amount,
        COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN p.payment_status = 'cancelled' THEN 1 END) as cancelled_count
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    WHERE p.payment_date BETWEEN v_start_date AND v_end_date
      AND (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
    
    UNION ALL
    
    SELECT 
        CONCAT('By Method - ', p.payment_method) as category,
        COUNT(*) as total_transactions,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount,
        MIN(p.amount) as minimum_amount,
        MAX(p.amount) as maximum_amount,
        COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completed_count,
        COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN p.payment_status = 'cancelled' THEN 1 END) as cancelled_count
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    WHERE p.payment_date BETWEEN v_start_date AND v_end_date
      AND (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
    GROUP BY p.payment_method
    
    ORDER BY category;
END$$

-- ============================================================================
-- 10. UPDATE PAYMENT STATUS
-- ============================================================================
DROP PROCEDURE IF EXISTS `updatePaymentStatus`$$
CREATE PROCEDURE `updatePaymentStatus`(
    IN `p_payment_id` INT,
    IN `p_new_status` ENUM('pending','completed','failed','cancelled'),
    IN `p_updated_by` INT,
    IN `p_reason` TEXT
)
BEGIN
    DECLARE v_old_status VARCHAR(20);
    DECLARE v_stallholder_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Get current status and stallholder
    SELECT payment_status, stallholder_id
    INTO v_old_status, v_stallholder_id
    FROM payments 
    WHERE payment_id = p_payment_id;
    
    IF v_old_status IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not found';
    END IF;
    
    -- Update payment
    UPDATE payments 
    SET payment_status = p_new_status,
        notes = CONCAT(
            COALESCE(notes, ''), 
            ' | Status changed from ', v_old_status, ' to ', p_new_status, 
            ' on ', NOW(), 
            ' by user ID ', p_updated_by,
            CASE WHEN p_reason IS NOT NULL THEN CONCAT(' | Reason: ', p_reason) ELSE '' END
        ),
        updated_at = NOW()
    WHERE payment_id = p_payment_id;
    
    -- Update stallholder status if payment completed
    IF p_new_status = 'completed' AND v_old_status != 'completed' THEN
        UPDATE stallholder 
        SET payment_status = 'current',
            last_payment_date = (
                SELECT payment_date 
                FROM payments 
                WHERE payment_id = p_payment_id
            ),
            updated_at = NOW()
        WHERE stallholder_id = v_stallholder_id;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, CONCAT('Payment status updated from ', v_old_status, ' to ', p_new_status) AS message;
END$$

DELIMITER ;

-- ============================================================================
-- CREATE INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Payment performance indexes
CREATE INDEX IF NOT EXISTS idx_payment_date_status ON payments(payment_date, payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_method_status ON payments(payment_method, payment_status);
CREATE INDEX IF NOT EXISTS idx_payment_for_month ON payments(payment_for_month);
CREATE INDEX IF NOT EXISTS idx_payment_reference ON payments(reference_number);

-- Stallholder payment status index  
CREATE INDEX IF NOT EXISTS idx_stallholder_payment_status ON stallholder(payment_status, last_payment_date);

-- ============================================================================
-- END OF PAYMENT STORED PROCEDURES
-- ============================================================================