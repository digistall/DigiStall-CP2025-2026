-- ============================================================================
-- DAILY PAYMENT STORED PROCEDURES
-- ============================================================================

DELIMITER $$

-- Drop existing procedures if they exist
DROP PROCEDURE IF EXISTS getAllDailyPayments$$
DROP PROCEDURE IF EXISTS getDailyPaymentById$$
DROP PROCEDURE IF EXISTS addDailyPayment$$
DROP PROCEDURE IF EXISTS updateDailyPayment$$
DROP PROCEDURE IF EXISTS deleteDailyPayment$$
DROP PROCEDURE IF EXISTS getAllVendorsForDailyPayments$$
DROP PROCEDURE IF EXISTS getAllCollectorsForDailyPayments$$

-- ============================================================================
-- Get all daily payments with related data
-- ============================================================================
CREATE PROCEDURE getAllDailyPayments()
BEGIN
    SELECT 
        dp.receipt_id,
        dp.collector_id,
        dp.vendor_id,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date,
        COALESCE(c.first_name, 'N/A') AS collector_name,
        COALESCE(v.first_name, 'N/A') AS vendor_name,
        c.contact_number AS collector_contact,
        v.email AS vendor_email
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    ORDER BY dp.time_date DESC, dp.receipt_id DESC;
END$$

-- ============================================================================
-- Get a single daily payment by receipt ID
-- ============================================================================
CREATE PROCEDURE getDailyPaymentById(
    IN p_receipt_id INT
)
BEGIN
    SELECT 
        dp.receipt_id,
        dp.collector_id,
        dp.vendor_id,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date,
        COALESCE(c.first_name, 'N/A') AS collector_name,
        COALESCE(v.first_name, 'N/A') AS vendor_name,
        c.contact_number AS collector_contact,
        v.email AS vendor_email
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = p_receipt_id;
END$$

-- ============================================================================
-- Add a new daily payment
-- ============================================================================
CREATE PROCEDURE addDailyPayment(
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10, 2),
    IN p_reference_no VARCHAR(100),
    IN p_status VARCHAR(50)
)
BEGIN
    DECLARE v_receipt_id INT;
    
    -- Validate inputs
    IF p_collector_id IS NULL OR p_collector_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Collector ID is required';
    END IF;
    
    IF p_vendor_id IS NULL OR p_vendor_id <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vendor ID is required';
    END IF;
    
    IF p_amount IS NULL OR p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Amount must be greater than 0';
    END IF;
    
    -- Check if collector exists
    IF NOT EXISTS (SELECT 1 FROM collector WHERE collector_id = p_collector_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Collector not found';
    END IF;
    
    -- Check if vendor exists
    IF NOT EXISTS (SELECT 1 FROM vendor WHERE vendor_id = p_vendor_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vendor not found';
    END IF;
    
    -- Insert the new payment
    INSERT INTO daily_payment (
        collector_id,
        vendor_id,
        amount,
        reference_no,
        status,
        time_date,
        created_at,
        updated_at
    ) VALUES (
        p_collector_id,
        p_vendor_id,
        p_amount,
        p_reference_no,
        COALESCE(p_status, 'completed'),
        NOW(),
        NOW(),
        NOW()
    );
    
    SET v_receipt_id = LAST_INSERT_ID();
    
    -- Return the inserted payment with all details
    SELECT 
        dp.receipt_id,
        dp.collector_id,
        dp.vendor_id,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date,
        COALESCE(c.first_name, 'N/A') AS collector_name,
        COALESCE(v.first_name, 'N/A') AS vendor_name,
        1 AS success,
        'Payment added successfully' AS message
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = v_receipt_id;
END$$

-- ============================================================================
-- Update an existing daily payment
-- ============================================================================
CREATE PROCEDURE updateDailyPayment(
    IN p_receipt_id INT,
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10, 2),
    IN p_reference_no VARCHAR(100),
    IN p_status VARCHAR(50)
)
BEGIN
    DECLARE v_exists INT;
    
    -- Check if payment exists
    SELECT COUNT(*) INTO v_exists FROM daily_payment WHERE receipt_id = p_receipt_id;
    
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not found';
    END IF;
    
    -- Validate collector if provided
    IF p_collector_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM collector WHERE collector_id = p_collector_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Collector not found';
    END IF;
    
    -- Validate vendor if provided
    IF p_vendor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vendor WHERE vendor_id = p_vendor_id) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vendor not found';
    END IF;
    
    -- Validate amount if provided
    IF p_amount IS NOT NULL AND p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Amount must be greater than 0';
    END IF;
    
    -- Update the payment
    UPDATE daily_payment
    SET
        collector_id = COALESCE(p_collector_id, collector_id),
        vendor_id = COALESCE(p_vendor_id, vendor_id),
        amount = COALESCE(p_amount, amount),
        reference_no = COALESCE(p_reference_no, reference_no),
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE receipt_id = p_receipt_id;
    
    -- Return the updated payment
    SELECT 
        dp.receipt_id,
        dp.collector_id,
        dp.vendor_id,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date,
        COALESCE(c.first_name, 'N/A') AS collector_name,
        COALESCE(v.first_name, 'N/A') AS vendor_name,
        1 AS success,
        'Payment updated successfully' AS message
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = p_receipt_id;
END$$

-- ============================================================================
-- Delete a daily payment
-- ============================================================================
CREATE PROCEDURE deleteDailyPayment(
    IN p_receipt_id INT
)
BEGIN
    DECLARE v_exists INT;
    
    -- Check if payment exists
    SELECT COUNT(*) INTO v_exists FROM daily_payment WHERE receipt_id = p_receipt_id;
    
    IF v_exists = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Payment not found';
    END IF;
    
    -- Delete the payment
    DELETE FROM daily_payment WHERE receipt_id = p_receipt_id;
    
    -- Return success message
    SELECT 
        p_receipt_id AS receipt_id,
        1 AS success,
        'Payment deleted successfully' AS message;
END$$

-- ============================================================================
-- Get all vendors for dropdown (payments form)
-- ============================================================================
CREATE PROCEDURE getAllVendorsForDailyPayments()
BEGIN
    SELECT 
        v.vendor_id,
        v.first_name,
        v.last_name,
        CONCAT(v.first_name, ' ', v.last_name) AS vendor_name,
        v.email,
        v.contact_number,
        v.status,
        vb.business_name,
        al.location_name
    FROM vendor v
    LEFT JOIN vendor_business vb ON v.vendor_business_id = vb.vendor_business_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    WHERE v.status = 'active' OR v.status IS NULL
    ORDER BY v.first_name ASC, v.last_name ASC;
END$$

-- ============================================================================
-- Get all collectors for dropdown (payments form)
-- ============================================================================
CREATE PROCEDURE getAllCollectorsForDailyPayments()
BEGIN
    SELECT 
        c.collector_id,
        c.first_name,
        c.last_name,
        CONCAT(c.first_name, ' ', c.last_name) AS collector_name,
        c.email,
        c.contact_number,
        c.collector_type,
        c.status,
        ca.assigned_location_id,
        al.location_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id
    LEFT JOIN assigned_location al ON ca.assigned_location_id = al.assigned_location_id
    WHERE c.status = 'active' OR c.status IS NULL
    ORDER BY c.first_name ASC, c.last_name ASC;
END$$

DELIMITER ;
