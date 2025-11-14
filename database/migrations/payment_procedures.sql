-- Payment System Stored Procedures
-- Run this directly in MySQL command line or phpMyAdmin

USE naga_stall;

DELIMITER $$

-- Procedure to record a new payment
CREATE PROCEDURE `recordPayment`(
    IN p_stallholder_id INT,
    IN p_payment_method ENUM('onsite','online','bank_transfer','check'),
    IN p_amount DECIMAL(10,2),
    IN p_payment_date DATE,
    IN p_payment_time TIME,
    IN p_payment_for_month VARCHAR(7),
    IN p_payment_type ENUM('rental','penalty','deposit','maintenance','other'),
    IN p_reference_number VARCHAR(100),
    IN p_collected_by VARCHAR(100),
    IN p_notes TEXT,
    IN p_branch_id INT,
    IN p_created_by INT
)
BEGIN
    DECLARE new_payment_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error recording payment: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    INSERT INTO payments (
        stallholder_id, payment_method, amount, payment_date, payment_time,
        payment_for_month, payment_type, reference_number, collected_by,
        notes, branch_id, created_by
    ) VALUES (
        p_stallholder_id, p_payment_method, p_amount, p_payment_date, p_payment_time,
        p_payment_for_month, p_payment_type, p_reference_number, p_collected_by,
        p_notes, p_branch_id, p_created_by
    );
    
    SET new_payment_id = LAST_INSERT_ID();
    
    COMMIT;
    
    SELECT 1 as success, 'Payment recorded successfully' AS message, new_payment_id AS payment_id;
END$$

-- Procedure to get stallholders for payment (with search)
CREATE PROCEDURE `getStallholdersForPayment`(
    IN p_branch_id INT,
    IN p_search_term VARCHAR(255)
)
BEGIN
    SELECT 
        s.stallholder_id,
        s.stallholder_id as id,
        CONCAT(s.first_name, ' ', s.last_name) AS stallholder_name,
        CONCAT(s.first_name, ' ', s.last_name) AS text,
        s.first_name,
        s.last_name,
        s.business_name,
        s.contact_number,
        s.email_address,
        st.stall_number,
        st.size,
        st.rental_fee,
        s.branch_id,
        IFNULL(last_payment.last_payment_date, 'No payments') as last_payment_date,
        IFNULL(last_payment.payment_method, 'N/A') as last_payment_method
    FROM stallholder s
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN (
        SELECT 
            stallholder_id,
            MAX(payment_date) as last_payment_date,
            payment_method
        FROM payments 
        WHERE payment_date = (
            SELECT MAX(payment_date) 
            FROM payments p2 
            WHERE p2.stallholder_id = payments.stallholder_id
        )
        GROUP BY stallholder_id
    ) last_payment ON s.stallholder_id = last_payment.stallholder_id
    WHERE s.branch_id = p_branch_id
    AND s.stallholder_status = 'Active'
    AND (
        p_search_term IS NULL 
        OR p_search_term = ''
        OR CONCAT(s.first_name, ' ', s.last_name) LIKE CONCAT('%', p_search_term, '%')
        OR s.business_name LIKE CONCAT('%', p_search_term, '%')
        OR st.stall_number LIKE CONCAT('%', p_search_term, '%')
    )
    ORDER BY CONCAT(s.first_name, ' ', s.last_name);
END$$

-- Procedure to get branch payments with filters
CREATE PROCEDURE `getBranchPayments`(
    IN p_branch_id INT,
    IN p_payment_method VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit_count INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.stallholder_id,
        CONCAT(s.first_name, ' ', s.last_name) AS stallholder_name,
        s.business_name,
        p.payment_method,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.reference_number,
        p.collected_by,
        p.payment_status,
        p.notes,
        st.stall_number,
        p.created_at,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
    FROM payments p
    LEFT JOIN stallholder s ON p.stallholder_id = s.stallholder_id
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN employee e ON p.created_by = e.employee_id
    WHERE p.branch_id = p_branch_id
    AND (p_payment_method IS NULL OR p_payment_method = '' OR p.payment_method = p_payment_method)
    AND (p_start_date IS NULL OR p.payment_date >= p_start_date)
    AND (p_end_date IS NULL OR p.payment_date <= p_end_date)
    ORDER BY p.payment_date DESC, p.payment_time DESC
    LIMIT IFNULL(p_limit_count, 100);
END$$

-- Procedure to get payments by stallholder
CREATE PROCEDURE `getPaymentsByStallholder`(
    IN p_stallholder_id INT,
    IN p_limit_count INT
)
BEGIN
    SELECT 
        p.payment_id,
        p.payment_method,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.payment_for_month,
        p.payment_type,
        p.reference_number,
        p.collected_by,
        p.payment_status,
        p.notes,
        p.created_at,
        CONCAT(s.first_name, ' ', s.last_name) AS stallholder_name,
        s.business_name,
        st.stall_number,
        e.first_name as employee_first_name,
        e.last_name as employee_last_name
    FROM payments p
    LEFT JOIN stallholder s ON p.stallholder_id = s.stallholder_id
    LEFT JOIN stall st ON s.stallholder_id = st.stallholder_id
    LEFT JOIN employee e ON p.created_by = e.employee_id
    WHERE p.stallholder_id = p_stallholder_id
    ORDER BY p.payment_date DESC, p.payment_time DESC
    LIMIT IFNULL(p_limit_count, 50);
END$$

-- Procedure to get payment summary by branch
CREATE PROCEDURE `getPaymentSummaryByBranch`(
    IN p_branch_id INT,
    IN p_year_month VARCHAR(7)
)
BEGIN
    SELECT 
        p.payment_method,
        COUNT(*) as transaction_count,
        SUM(p.amount) as total_amount,
        AVG(p.amount) as average_amount,
        MIN(p.amount) as minimum_amount,
        MAX(p.amount) as maximum_amount,
        DATE(MIN(p.payment_date)) as first_payment_date,
        DATE(MAX(p.payment_date)) as last_payment_date
    FROM payments p
    WHERE p.branch_id = p_branch_id
    AND (p_year_month IS NULL OR p.payment_for_month = p_year_month)
    AND p.payment_status = 'completed'
    GROUP BY p.payment_method
    ORDER BY total_amount DESC;
END$$

DELIMITER ;

SELECT 'Payment system stored procedures created successfully!' as status;