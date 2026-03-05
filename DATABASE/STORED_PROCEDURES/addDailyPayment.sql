-- =====================================================
-- Stored Procedure: addDailyPayment
-- Description: Inserts a new record into daily_payments
--              Validates required fields and returns success/error
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS addDailyPayment //

CREATE PROCEDURE addDailyPayment(
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(45),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_receipt_id INT DEFAULT NULL;
    DECLARE v_now TIMESTAMP;

    -- Basic validation
    IF p_collector_id IS NULL OR p_collector_id <= 0 THEN
        SELECT 0 AS success, 'Collector ID is required' AS message;
        LEAVE proc_end;
    END IF;

    IF p_vendor_id IS NULL OR p_vendor_id <= 0 THEN
        SELECT 0 AS success, 'Vendor ID is required' AS message;
        LEAVE proc_end;
    END IF;

    IF p_amount IS NULL OR p_amount <= 0 THEN
        SELECT 0 AS success, 'Amount must be greater than zero' AS message;
        LEAVE proc_end;
    END IF;

    -- Ensure collector exists
    SELECT COUNT(*) INTO v_exists FROM collector WHERE collector_id = p_collector_id;
    IF v_exists = 0 THEN
        SELECT 0 AS success, 'Collector not found' AS message;
        LEAVE proc_end;
    END IF;

    -- Ensure vendor exists
    SELECT COUNT(*) INTO v_exists FROM vendor WHERE vendor_id = p_vendor_id;
    IF v_exists = 0 THEN
        SELECT 0 AS success, 'Vendor not found' AS message;
        LEAVE proc_end;
    END IF;

    SET v_now = NOW();

    -- Insert payment
    INSERT INTO daily_payments (collector_id, vendor_id, amount, reference_no, status, time_date)
    VALUES (p_collector_id, p_vendor_id, p_amount, p_reference_no, p_status, v_now);

    SET v_receipt_id = LAST_INSERT_ID();

    -- Return created record with success flag
    SELECT
        1 AS success,
        'Daily payment created successfully' AS message,
        dp.receipt_id,
        dp.collector_id,
        c.first_name AS collector_first_name,
        c.last_name AS collector_last_name,
        dp.vendor_id,
        v.first_name AS vendor_first_name,
        v.last_name AS vendor_last_name,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payments dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = v_receipt_id
    LIMIT 1;

    proc_end: BEGIN
    END;
END //

DELIMITER ;

-- Usage:
-- CALL addDailyPayment(1, 2, 150.00, 'REF-001', 'completed');
