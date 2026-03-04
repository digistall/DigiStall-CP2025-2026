-- =====================================================
-- Installer: install_daily_payments_procedures.sql
-- Description: Creates stored procedures used by the Daily Payment
--              module (fetch, add, update, delete + dropdowns)
-- Usage: Paste entire file into MySQL Workbench and execute.
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

-- =====================================================
-- getAllCollectorsForDailyPayments
-- Returns collector_id, collector_name
-- =====================================================
DROP PROCEDURE IF EXISTS getAllCollectorsForDailyPayments //
CREATE PROCEDURE getAllCollectorsForDailyPayments()
BEGIN
    SELECT
        c.collector_id,
        c.first_name,
        c.last_name
    FROM collector c
    WHERE c.status IS NULL OR LOWER(c.status) <> 'inactive'
    ORDER BY c.collector_id;
END //

-- =====================================================
-- getAllVendorsForDailyPayments
-- Returns vendor_id, vendor_name (first_name + last_name)
-- =====================================================
DROP PROCEDURE IF EXISTS getAllVendorsForDailyPayments //
CREATE PROCEDURE getAllVendorsForDailyPayments()
BEGIN
    SELECT
        v.vendor_id,
        v.first_name,
        v.last_name
    FROM vendor v
    WHERE v.status IS NULL OR LOWER(v.status) <> 'inactive'
    ORDER BY v.vendor_id;
END //

-- =====================================================
-- getAllDailyPayments
-- Returns table-ready rows of daily payments (includes collector & vendor names)
-- =====================================================
DROP PROCEDURE IF EXISTS getAllDailyPayments //
CREATE PROCEDURE getAllDailyPayments()
BEGIN
    SELECT
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
    ORDER BY dp.time_date DESC;
END //

-- =====================================================
-- getDailyPaymentById
-- Returns a single payment row by receipt_id
-- =====================================================
DROP PROCEDURE IF EXISTS getDailyPaymentById //
CREATE PROCEDURE getDailyPaymentById(
    IN p_receipt_id INT
)
BEGIN
    SELECT
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
    WHERE dp.receipt_id = p_receipt_id
    LIMIT 1;
END //

-- =====================================================
-- addDailyPayment
-- Validates inputs, inserts a daily payment, returns success + inserted row
-- =====================================================
DROP PROCEDURE IF EXISTS addDailyPayment //
CREATE PROCEDURE addDailyPayment(
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(255),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    DECLARE v_receipt_id INT DEFAULT NULL;
    DECLARE v_now TIMESTAMP;

    proc_body: BEGIN
        -- Basic validation
        IF p_collector_id IS NULL OR p_collector_id <= 0 THEN
            SELECT 0 AS success, 'Collector ID is required' AS message;
            LEAVE proc_body;
        END IF;

        IF p_vendor_id IS NULL OR p_vendor_id <= 0 THEN
            SELECT 0 AS success, 'Vendor ID is required' AS message;
            LEAVE proc_body;
        END IF;

        IF p_amount IS NULL OR p_amount <= 0 THEN
            SELECT 0 AS success, 'Amount must be greater than zero' AS message;
            LEAVE proc_body;
        END IF;

        -- Ensure collector exists
        SELECT COUNT(*) INTO v_exists FROM collector WHERE collector_id = p_collector_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Collector not found' AS message;
            LEAVE proc_body;
        END IF;

        -- Ensure vendor exists
        SELECT COUNT(*) INTO v_exists FROM vendor WHERE vendor_id = p_vendor_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Vendor not found' AS message;
            LEAVE proc_body;
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
    END proc_body;
END //

-- =====================================================
-- updateDailyPayment
-- Updates provided fields (non-NULL only), returns updated row + success
-- =====================================================
DROP PROCEDURE IF EXISTS updateDailyPayment //
CREATE PROCEDURE updateDailyPayment(
    IN p_receipt_id INT,
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(255),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    proc_body: BEGIN
        IF p_receipt_id IS NULL OR p_receipt_id <= 0 THEN
            SELECT 0 AS success, 'Receipt ID is required' AS message;
            LEAVE proc_body;
        END IF;

        SELECT COUNT(*) INTO v_exists FROM daily_payments WHERE receipt_id = p_receipt_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Daily payment not found' AS message;
            LEAVE proc_body;
        END IF;

        -- Optional validation for collector/vendor if provided
        IF p_collector_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_exists FROM collector WHERE collector_id = p_collector_id;
            IF v_exists = 0 THEN
                SELECT 0 AS success, 'Collector not found' AS message;
                LEAVE proc_body;
            END IF;
        END IF;

        IF p_vendor_id IS NOT NULL THEN
            SELECT COUNT(*) INTO v_exists FROM vendor WHERE vendor_id = p_vendor_id;
            IF v_exists = 0 THEN
                SELECT 0 AS success, 'Vendor not found' AS message;
                LEAVE proc_body;
            END IF;
        END IF;

        -- Perform update (only update provided non-NULL values)
        UPDATE daily_payments
        SET
            collector_id = COALESCE(p_collector_id, collector_id),
            vendor_id = COALESCE(p_vendor_id, vendor_id),
            amount = COALESCE(p_amount, amount),
            reference_no = COALESCE(p_reference_no, reference_no),
            status = COALESCE(p_status, status)
        WHERE receipt_id = p_receipt_id;

        -- Return updated record
        SELECT
            1 AS success,
            'Daily payment updated successfully' AS message,
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
        WHERE dp.receipt_id = p_receipt_id
        LIMIT 1;
    END proc_body;
END //

-- =====================================================
-- deleteDailyPayment
-- Deletes payment and returns success message
-- =====================================================
DROP PROCEDURE IF EXISTS deleteDailyPayment //
CREATE PROCEDURE deleteDailyPayment(
    IN p_receipt_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    proc_body: BEGIN
        IF p_receipt_id IS NULL OR p_receipt_id <= 0 THEN
            SELECT 0 AS success, 'Receipt ID is required' AS message;
            LEAVE proc_body;
        END IF;

        SELECT COUNT(*) INTO v_exists FROM daily_payments WHERE receipt_id = p_receipt_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Daily payment not found' AS message;
            LEAVE proc_body;
        END IF;

        DELETE FROM daily_payments WHERE receipt_id = p_receipt_id;

        SELECT 1 AS success, 'Daily payment deleted successfully' AS message, p_receipt_id AS receipt_id;
    END proc_body;
END //

DELIMITER ;

-- End of installer
