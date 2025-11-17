-- =====================================================
-- Onsite Payment Stored Procedures
-- =====================================================

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS sp_get_all_stallholders;
DROP PROCEDURE IF EXISTS sp_get_stallholder_details;
DROP PROCEDURE IF EXISTS sp_generate_receipt_number;
DROP PROCEDURE IF EXISTS sp_add_payment;

-- =====================================================
-- 1. Get All Stallholders for Dropdown
-- =====================================================
DELIMITER $$
CREATE PROCEDURE sp_get_all_stallholders(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id as id,
        sh.stallholder_name as name,
        sh.contact_number as contact,
        sh.business_name as businessName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.payment_status as paymentStatus
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR sh.branch_id = p_branch_id)
      AND sh.stallholder_status = 'active'
    ORDER BY sh.stallholder_name ASC;
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
        COALESCE(sh.monthly_rent, st.rental_price, 0) as monthlyRental,
        COALESCE(st.stall_size, 'N/A') as stallSize,
        COALESCE(b.branch_name, 'Unknown') as branchName,
        sh.payment_status as paymentStatus,
        sh.last_payment_date as lastPaymentDate,
        sh.branch_id as branchId
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.stallholder_id = p_stallholder_id;
END$$

-- =====================================================
-- 3. Generate Receipt Number
-- =====================================================
CREATE PROCEDURE sp_generate_receipt_number()
BEGIN
    DECLARE v_date_prefix VARCHAR(8);
    DECLARE v_sequence_no INT;
    DECLARE v_receipt_number VARCHAR(20);
    
    -- Get date prefix (YYYYMMDD format)
    SET v_date_prefix = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Get the next sequence number for today
    SELECT COALESCE(MAX(CAST(SUBSTRING(reference_number, 13, 3) AS UNSIGNED)), 0) + 1
    INTO v_sequence_no
    FROM payments 
    WHERE reference_number LIKE CONCAT('RCP-', v_date_prefix, '-%')
      AND payment_method = 'onsite';
    
    -- Generate receipt number: RCP-YYYYMMDD-XXX
    SET v_receipt_number = CONCAT('RCP-', v_date_prefix, '-', LPAD(v_sequence_no, 3, '0'));
    
    SELECT v_receipt_number as receiptNumber;
END$$

-- =====================================================
-- 4. Add Payment
-- =====================================================
CREATE PROCEDURE sp_add_payment(
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
    DECLARE v_payment_id INT;
    DECLARE v_stallholder_name VARCHAR(255);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Validate stallholder exists
    SELECT stallholder_name INTO v_stallholder_name
    FROM stallholder 
    WHERE stallholder_id = p_stallholder_id;
    
    IF v_stallholder_name IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Stallholder not found';
    END IF;
    
    -- Insert payment record
    INSERT INTO payments (
        stallholder_id,
        amount,
        payment_date,
        payment_time,
        payment_method,
        payment_status,
        payment_type,
        payment_for_month,
        reference_number,
        collected_by,
        notes,
        branch_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        p_stallholder_id,
        p_amount,
        p_payment_date,
        p_payment_time,
        'onsite',
        'completed',
        p_payment_type,
        p_payment_for_month,
        p_reference_number,
        p_collected_by,
        p_notes,
        p_branch_id,
        p_created_by,
        NOW(),
        NOW()
    );
    
    SET v_payment_id = LAST_INSERT_ID();
    
    -- Update stallholder payment status
    UPDATE stallholder 
    SET last_payment_date = p_payment_date,
        payment_status = 'current',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    SELECT 1 as success, 'Payment added successfully' AS message, v_payment_id as payment_id;
END$$

DELIMITER ;

-- Test the stored procedures
-- SELECT 'Testing sp_get_all_stallholders' as test;
-- CALL sp_get_all_stallholders(NULL);

-- SELECT 'Testing sp_generate_receipt_number' as test;
-- CALL sp_generate_receipt_number();