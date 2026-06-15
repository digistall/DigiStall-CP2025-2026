-- =====================================================
-- Stored Procedure: sp_CreateDailyPayment
-- Description: Creates a daily payment with auto-generated reference number
--              Format: DP-YYYYMMDD-XXXXXX (sequential per day)
--              Used by collector mobile app QR payment flow
-- Author: QR Collection System
-- Date: 2026-06-15
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS sp_CreateDailyPayment //

CREATE PROCEDURE sp_CreateDailyPayment(
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_status VARCHAR(45)
)
proc_main: BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_receipt_id INT DEFAULT NULL;
    DECLARE v_reference_no VARCHAR(45);
    DECLARE v_today_count INT DEFAULT 0;
    DECLARE v_date_str VARCHAR(8);
    DECLARE v_now TIMESTAMP;
    DECLARE v_vendor_status VARCHAR(45);
    DECLARE v_final_status VARCHAR(45);

    -- Determine final status (default to 'completed')
    SET v_final_status = COALESCE(NULLIF(TRIM(p_status), ''), 'completed');

    -- Basic validation: Collector ID
    IF p_collector_id IS NULL OR p_collector_id <= 0 THEN
        SELECT 0 AS success, 'Collector ID is required' AS message;
        LEAVE proc_main;
    END IF;

    -- Basic validation: Vendor ID
    IF p_vendor_id IS NULL OR p_vendor_id <= 0 THEN
        SELECT 0 AS success, 'Vendor ID is required' AS message;
        LEAVE proc_main;
    END IF;

    -- Basic validation: Amount (allow 0 for missing payments)
    IF p_amount IS NULL OR p_amount < 0 THEN
        SELECT 0 AS success, 'Amount cannot be negative' AS message;
        LEAVE proc_main;
    END IF;

    -- If status is not 'missing', amount must be > 0
    IF v_final_status <> 'missing' AND p_amount <= 0 THEN
        SELECT 0 AS success, 'Amount must be greater than zero for non-missing payments' AS message;
        LEAVE proc_main;
    END IF;

    -- Ensure collector exists
    SELECT COUNT(*) INTO v_exists FROM collector WHERE collector_id = p_collector_id;
    IF v_exists = 0 THEN
        SELECT 0 AS success, 'Collector not found' AS message;
        LEAVE proc_main;
    END IF;

    -- Ensure vendor exists and is active
    SET v_exists = 0;
    SELECT COUNT(*), MAX(status) INTO v_exists, v_vendor_status
    FROM vendor WHERE vendor_id = p_vendor_id;
    
    IF v_exists = 0 THEN
        SELECT 0 AS success, 'Vendor not found' AS message;
        LEAVE proc_main;
    END IF;

    IF LOWER(v_vendor_status) = 'inactive' THEN
        SELECT 0 AS success, 'Vendor is inactive' AS message;
        LEAVE proc_main;
    END IF;

    -- Generate reference number: DP-YYYYMMDD-XXXXXX
    SET v_now = NOW();
    SET v_date_str = DATE_FORMAT(v_now, '%Y%m%d');

    -- Count existing payments today to determine sequence
    SELECT COUNT(*) INTO v_today_count
    FROM daily_payments
    WHERE DATE(time_date) = DATE(v_now);

    SET v_reference_no = CONCAT('DP-', v_date_str, '-', LPAD(v_today_count + 1, 6, '0'));

    -- Insert payment record
    INSERT INTO daily_payments (collector_id, vendor_id, amount, reference_no, status, time_date)
    VALUES (p_collector_id, p_vendor_id, p_amount, v_reference_no, v_final_status, v_now);

    SET v_receipt_id = LAST_INSERT_ID();

    -- Return created payment with full details
    SELECT
        1 AS success,
        'Payment recorded successfully' AS message,
        dp.receipt_id,
        dp.collector_id,
        c.first_name AS collector_first_name,
        c.last_name AS collector_last_name,
        dp.vendor_id,
        v.first_name AS vendor_first_name,
        v.last_name AS vendor_last_name,
        v.vendor_identifier,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date,
        al.location_name
    FROM daily_payments dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    LEFT JOIN assigned_location al ON v.assigned_location_id = al.assigned_location_id
    WHERE dp.receipt_id = v_receipt_id
    LIMIT 1;

END //

DELIMITER ;

-- Usage:
-- CALL sp_CreateDailyPayment(1, 2, 25.00, 'completed');
-- CALL sp_CreateDailyPayment(1, 2, 0.00, 'missing');
-- Returns receipt with auto-generated reference: DP-20260615-000001
