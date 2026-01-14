-- ============================================================================
-- DAILY PAYMENT MIGRATIONS - ALL IN ONE FILE
-- Copy this entire file and paste into MySQL Workbench, then execute
-- Database: naga_stall
-- Date: 2026-01-10
-- ============================================================================

USE naga_stall;

-- ============================================================================
-- Migration 405: Get all daily payments
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllDailyPayments`$$

CREATE PROCEDURE `getAllDailyPayments`()
BEGIN
    SELECT 
        dp.receipt_id,
        dp.collector_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS collector_name,
        dp.vendor_id,
        CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, '')) AS vendor_name,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    ORDER BY dp.time_date DESC, dp.receipt_id DESC;
END$$

DELIMITER ;

-- ============================================================================
-- Migration 406: Get daily payment by ID
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `getDailyPaymentById`$$

CREATE PROCEDURE `getDailyPaymentById`(
    IN p_receipt_id INT
)
BEGIN
    SELECT 
        dp.receipt_id,
        dp.collector_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS collector_name,
        c.email AS collector_email,
        c.contact_no AS collector_contact,
        dp.vendor_id,
        CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, '')) AS vendor_name,
        v.email AS vendor_email,
        v.phone AS vendor_contact,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = p_receipt_id;
END$$

DELIMITER ;

-- ============================================================================
-- Migration 407: Add daily payment
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `addDailyPayment`$$

CREATE PROCEDURE `addDailyPayment`(
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(20),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE v_receipt_id INT;
    DECLARE v_error_message VARCHAR(255);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 AS success, IFNULL(v_error_message, 'Failed to add daily payment') AS message;
    END;
    
    START TRANSACTION;
    
    -- Validate collector exists
    IF NOT EXISTS (SELECT 1 FROM collector WHERE collector_id = p_collector_id) THEN
        SET v_error_message = 'Collector not found';
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Collector not found';
    END IF;
    
    -- Validate vendor exists
    IF NOT EXISTS (SELECT 1 FROM vendor WHERE vendor_id = p_vendor_id) THEN
        SET v_error_message = 'Vendor not found';
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Vendor not found';
    END IF;
    
    -- Validate amount
    IF p_amount <= 0 THEN
        SET v_error_message = 'Amount must be greater than 0';
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Amount must be greater than 0';
    END IF;
    
    -- Insert daily payment
    INSERT INTO daily_payment (
        collector_id,
        vendor_id,
        amount,
        reference_no,
        status,
        time_date
    ) VALUES (
        p_collector_id,
        p_vendor_id,
        p_amount,
        p_reference_no,
        COALESCE(p_status, 'completed'),
        NOW()
    );
    
    SET v_receipt_id = LAST_INSERT_ID();
    
    COMMIT;
    
    -- Return the newly created payment
    SELECT 
        1 AS success,
        'Daily payment added successfully' AS message,
        v_receipt_id AS receipt_id,
        dp.collector_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS collector_name,
        dp.vendor_id,
        CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, '')) AS vendor_name,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = v_receipt_id;
END$$

DELIMITER ;

-- ============================================================================
-- Migration 408: Update daily payment
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateDailyPayment`$$

CREATE PROCEDURE `updateDailyPayment`(
    IN p_receipt_id INT,
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(20),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 AS success, 'Failed to update daily payment' AS message;
    END;
    
    START TRANSACTION;
    
    -- Validate payment exists
    IF NOT EXISTS (SELECT 1 FROM daily_payment WHERE receipt_id = p_receipt_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Daily payment not found';
    END IF;
    
    -- Validate collector exists (if provided)
    IF p_collector_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM collector WHERE collector_id = p_collector_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Collector not found';
    END IF;
    
    -- Validate vendor exists (if provided)
    IF p_vendor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vendor WHERE vendor_id = p_vendor_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Vendor not found';
    END IF;
    
    -- Validate amount (if provided)
    IF p_amount IS NOT NULL AND p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Amount must be greater than 0';
    END IF;
    
    -- Update daily payment
    UPDATE daily_payment
    SET 
        collector_id = COALESCE(p_collector_id, collector_id),
        vendor_id = COALESCE(p_vendor_id, vendor_id),
        amount = COALESCE(p_amount, amount),
        reference_no = COALESCE(p_reference_no, reference_no),
        status = COALESCE(p_status, status)
    WHERE receipt_id = p_receipt_id;
    
    COMMIT;
    
    -- Return the updated payment
    SELECT 
        1 AS success,
        'Daily payment updated successfully' AS message,
        dp.receipt_id,
        dp.collector_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS collector_name,
        dp.vendor_id,
        CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, '')) AS vendor_name,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = p_receipt_id;
END$$

DELIMITER ;

-- ============================================================================
-- Migration 409: Delete daily payment
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteDailyPayment`$$

CREATE PROCEDURE `deleteDailyPayment`(
    IN p_receipt_id INT
)
BEGIN
    DECLARE v_affected_rows INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 AS success, 'Failed to delete daily payment' AS message;
    END;
    
    START TRANSACTION;
    
    -- Validate payment exists
    IF NOT EXISTS (SELECT 1 FROM daily_payment WHERE receipt_id = p_receipt_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Daily payment not found';
    END IF;
    
    -- Delete the payment
    DELETE FROM daily_payment WHERE receipt_id = p_receipt_id;
    
    SET v_affected_rows = ROW_COUNT();
    
    COMMIT;
    
    SELECT 
        1 AS success,
        'Daily payment deleted successfully' AS message,
        v_affected_rows AS affected_rows;
END$$

DELIMITER ;

-- ============================================================================
-- Migration 410: Get all vendors
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllVendors`$$

CREATE PROCEDURE `getAllVendors`()
BEGIN
    SELECT 
        vendor_id,
        CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) AS vendor_name,
        email,
        phone,
        business_type,
        status
    FROM vendor
    WHERE status = 'Active'
    ORDER BY first_name, last_name;
END$$

DELIMITER ;

-- ============================================================================
-- Migration 411: Get all collectors
-- ============================================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllCollectors`$$

CREATE PROCEDURE `getAllCollectors`()
BEGIN
    SELECT 
        collector_id,
        CONCAT(COALESCE(first_name, ''), ' ', COALESCE(last_name, '')) AS collector_name,
        email,
        contact_no,
        status
    FROM collector
    WHERE status = 'active'
    ORDER BY first_name, last_name;
END$$

DELIMITER ;

-- ============================================================================
-- VERIFY PROCEDURES WERE CREATED
-- ============================================================================

SELECT 
    ROUTINE_NAME AS 'Procedure Name',
    ROUTINE_TYPE AS 'Type',
    CREATED AS 'Created Date'
FROM information_schema.ROUTINES
WHERE ROUTINE_SCHEMA = 'naga_stall'
AND ROUTINE_NAME IN (
    'getAllDailyPayments',
    'getDailyPaymentById',
    'addDailyPayment',
    'updateDailyPayment',
    'deleteDailyPayment',
    'getAllVendors',
    'getAllCollectors'
)
ORDER BY ROUTINE_NAME;

-- You should see 7 procedures listed above
