-- =====================================================
-- Payment Management Stored Procedures
-- Complete solution for payment dropdown and management
-- =====================================================

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS sp_get_stallholders_for_manager;
DROP PROCEDURE IF EXISTS sp_get_stallholder_details;
DROP PROCEDURE IF EXISTS sp_generate_receipt_number;
DROP PROCEDURE IF EXISTS sp_add_payment;

-- =====================================================
-- 1. Get Stallholders for Specific Manager
-- This procedure filters stallholders by branch manager
-- AND includes stallholders who already have payments
-- =====================================================
DELIMITER $$
CREATE PROCEDURE sp_get_stallholders_for_manager(
    IN p_manager_id INT
)
BEGIN
    DECLARE manager_branch_id INT DEFAULT NULL;
    
    -- Get the branch ID for the manager
    SELECT branch_id INTO manager_branch_id 
    FROM user 
    WHERE user_id = p_manager_id 
    AND user_type IN ('branch_manager', 'admin');
    
    -- If manager not found or no branch assigned, return empty result
    IF manager_branch_id IS NULL THEN
        SELECT 'No stallholders found for this manager' as message;
    ELSE
        -- Return all active stallholders in the manager's branch
        -- INCLUDING those who already have payments
        SELECT 
            sh.stallholder_id as id,
            sh.stallholder_name as name,
            sh.contact_number as contact,
            sh.business_name as businessName,
            COALESCE(st.stall_no, 'N/A') as stallNo,
            COALESCE(st.stall_location, 'N/A') as stallLocation,
            COALESCE(st.rental_price, st.monthly_rental, 0) as monthlyRental,
            COALESCE(b.branch_name, 'Unknown') as branchName,
            sh.contract_status as contractStatus,
            sh.stallholder_status as stallholderStatus,
            -- Count existing payments (optional info)
            COALESCE(payment_count.total_payments, 0) as totalPayments,
            COALESCE(payment_count.last_payment_date, NULL) as lastPaymentDate
        FROM stallholder sh
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        LEFT JOIN (
            SELECT 
                stallholder_id,
                COUNT(*) as total_payments,
                MAX(payment_date) as last_payment_date
            FROM payment 
            GROUP BY stallholder_id
        ) payment_count ON sh.stallholder_id = payment_count.stallholder_id
        WHERE sh.branch_id = manager_branch_id
          AND sh.stallholder_status = 'active'
          AND (sh.contract_status = 'active' OR sh.contract_status IS NULL)
        ORDER BY sh.stallholder_name ASC;
    END IF;
END$$

-- =====================================================
-- 2. Get Stallholder Details for Auto-Fill
-- =====================================================
CREATE PROCEDURE sp_get_stallholder_details(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(st.stall_location, 'N/A') as stallLocation,
        COALESCE(st.rental_price, st.monthly_rental, 0) as monthlyRental,
        COALESCE(st.utilities_fee, 0) as utilitiesFee,
        COALESCE(st.maintenance_fee, 0) as maintenanceFee,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        b.branch_id as branchId,
        sh.contract_status as contractStatus,
        sh.stallholder_status as stallholderStatus,
        sh.date_registered as dateRegistered,
        -- Payment history summary
        COALESCE(payment_summary.total_paid, 0) as totalPaid,
        COALESCE(payment_summary.last_payment_date, NULL) as lastPaymentDate,
        COALESCE(payment_summary.payment_count, 0) as paymentCount
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN (
        SELECT 
            stallholder_id,
            SUM(amount) as total_paid,
            MAX(payment_date) as last_payment_date,
            COUNT(*) as payment_count
        FROM payment 
        WHERE stallholder_id = p_stallholder_id
        GROUP BY stallholder_id
    ) payment_summary ON sh.stallholder_id = payment_summary.stallholder_id
    WHERE sh.stallholder_id = p_stallholder_id;
END$$

-- =====================================================
-- 3. Generate Receipt Number
-- =====================================================
CREATE PROCEDURE sp_generate_receipt_number()
BEGIN
    DECLARE next_number INT DEFAULT 1;
    DECLARE receipt_number VARCHAR(20);
    DECLARE current_date VARCHAR(8);
    
    -- Get current date in YYYYMMDD format
    SET current_date = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Get the next sequential number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number, -2) AS UNSIGNED)), 0) + 1
    INTO next_number
    FROM payment 
    WHERE reference_number LIKE CONCAT('RCP-', current_date, '%')
    AND reference_number REGEXP '^RCP-[0-9]{8}[0-9]{2}$';
    
    -- Ensure we don't exceed 99 payments per day
    IF next_number > 99 THEN
        SET next_number = 99;
    END IF;
    
    -- Format receipt number as RCP-YYYYMMDDXX
    SET receipt_number = CONCAT('RCP-', current_date, LPAD(next_number, 2, '0'));
    
    SELECT receipt_number as receiptNumber;
END$$

-- =====================================================
-- 4. Add Payment Record
-- =====================================================
CREATE PROCEDURE sp_add_payment(
    IN p_stallholder_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_payment_date DATE,
    IN p_payment_time TIME,
    IN p_payment_for_month VARCHAR(7), -- YYYY-MM format
    IN p_payment_type ENUM('rental', 'utilities', 'maintenance', 'penalty', 'other'),
    IN p_payment_method ENUM('cash', 'gcash', 'maya', 'paymaya', 'bank_transfer', 'check'),
    IN p_reference_number VARCHAR(100),
    IN p_collected_by_user_id INT,
    IN p_notes TEXT
)
BEGIN
    DECLARE payment_id INT;
    DECLARE collected_by_name VARCHAR(200);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            @error_code = MYSQL_ERRNO,
            @error_message = MESSAGE_TEXT;
        SELECT CONCAT('Error: ', @error_code, ' - ', @error_message) as error_message;
    END;
    
    START TRANSACTION;
    
    -- Get collected by user name
    SELECT CONCAT(first_name, ' ', last_name) 
    INTO collected_by_name
    FROM user 
    WHERE user_id = p_collected_by_user_id;
    
    IF collected_by_name IS NULL THEN
        SET collected_by_name = 'System User';
    END IF;
    
    -- Insert the payment record
    INSERT INTO payment (
        stallholder_id,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        payment_method,
        reference_number,
        collected_by,
        collected_by_user_id,
        notes,
        payment_status,
        created_at,
        updated_at
    ) VALUES (
        p_stallholder_id,
        p_amount,
        p_payment_date,
        p_payment_time,
        p_payment_for_month,
        p_payment_type,
        p_payment_method,
        p_reference_number,
        collected_by_name,
        p_collected_by_user_id,
        p_notes,
        'completed',
        NOW(),
        NOW()
    );
    
    SET payment_id = LAST_INSERT_ID();
    
    -- Update stallholder payment status if needed
    UPDATE stallholder 
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    -- Return the payment ID and success message
    SELECT 
        payment_id as paymentId,
        'Payment added successfully' as message,
        p_reference_number as referenceNumber,
        collected_by_name as collectedBy;
END$$

-- =====================================================
-- 5. Get Payments for Manager's Branch
-- =====================================================
CREATE PROCEDURE sp_get_payments_for_manager(
    IN p_manager_id INT,
    IN p_limit INT,
    IN p_offset INT,
    IN p_search VARCHAR(255)
)
BEGIN
    DECLARE manager_branch_id INT DEFAULT NULL;
    
    -- Get the branch ID for the manager
    SELECT branch_id INTO manager_branch_id 
    FROM user 
    WHERE user_id = p_manager_id 
    AND user_type IN ('branch_manager', 'admin');
    
    IF manager_branch_id IS NULL THEN
        SELECT 'No payments found for this manager' as message;
    ELSE
        SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            sh.stallholder_name as stallholderName,
            COALESCE(st.stall_no, 'N/A') as stallNo,
            p.amount,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.payment_for_month as paymentForMonth,
            p.payment_type as paymentType,
            p.payment_method as method,
            p.reference_number as referenceNo,
            p.collected_by as collectedBy,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            b.branch_name as branchName
        FROM payment p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.branch_id = manager_branch_id
        AND (
            p_search IS NULL 
            OR p_search = ''
            OR p.reference_number LIKE CONCAT('%', p_search, '%')
            OR sh.stallholder_name LIKE CONCAT('%', p_search, '%')
            OR st.stall_no LIKE CONCAT('%', p_search, '%')
        )
        ORDER BY p.created_at DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END$$

DELIMITER ;

-- =====================================================
-- Test the procedures (optional - comment out in production)
-- =====================================================
-- Example calls:
-- CALL sp_get_stallholders_for_manager(1);
-- CALL sp_get_stallholder_details(1);
-- CALL sp_generate_receipt_number();
-- CALL sp_get_payments_for_manager(1, 50, 0, '');