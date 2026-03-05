-- Direct fixes for Daily Payments procedures
-- Copy and paste each CREATE statement individually into MySQL Workbench

-- Fix 1: getAllCollectorsForDailyPayments
DROP PROCEDURE IF EXISTS getAllCollectorsForDailyPayments;

CREATE PROCEDURE getAllCollectorsForDailyPayments()
BEGIN
    SELECT
        c.collector_id,
        TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) AS collector_name
    FROM collector c
    WHERE c.status IS NULL OR LOWER(c.status) <> 'inactive'
    ORDER BY collector_name;
END;

-- Fix 2: getAllVendorsForDailyPayments
DROP PROCEDURE IF EXISTS getAllVendorsForDailyPayments;

CREATE PROCEDURE getAllVendorsForDailyPayments()
BEGIN
    SELECT
        v.vendor_id,
        TRIM(CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, ''))) AS vendor_name
    FROM vendor v
    WHERE v.status IS NULL OR LOWER(v.status) <> 'inactive'
    ORDER BY vendor_name;
END;

-- Fix 3: getAllDailyPayments
DROP PROCEDURE IF EXISTS getAllDailyPayments;

CREATE PROCEDURE getAllDailyPayments()
BEGIN
    SELECT
        dp.receipt_id,
        dp.collector_id,
        TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) AS collector_name,
        dp.vendor_id,
        TRIM(CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, ''))) AS vendor_name,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payments dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    ORDER BY dp.time_date DESC;
END;

-- Fix 4: getDailyPaymentById
DROP PROCEDURE IF EXISTS getDailyPaymentById;

CREATE PROCEDURE getDailyPaymentById(
    IN p_receipt_id INT
)
BEGIN
    SELECT
        dp.receipt_id,
        dp.collector_id,
        TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) AS collector_name,
        dp.vendor_id,
        TRIM(CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, ''))) AS vendor_name,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payments dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = p_receipt_id
    LIMIT 1;
END;

-- Fix 5: addDailyPayment (simplified)
DROP PROCEDURE IF EXISTS addDailyPayment;

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

    -- Basic validation
    IF p_collector_id IS NULL OR p_collector_id <= 0 THEN
        SELECT 0 AS success, 'Collector ID is required' AS message;
    ELSEIF p_vendor_id IS NULL OR p_vendor_id <= 0 THEN
        SELECT 0 AS success, 'Vendor ID is required' AS message;
    ELSEIF p_amount IS NULL OR p_amount <= 0 THEN
        SELECT 0 AS success, 'Amount must be greater than zero' AS message;
    ELSE
        -- Ensure collector exists
        SELECT COUNT(*) INTO v_exists FROM collector WHERE collector_id = p_collector_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Collector not found' AS message;
        ELSE
            -- Ensure vendor exists
            SELECT COUNT(*) INTO v_exists FROM vendor WHERE vendor_id = p_vendor_id;
            IF v_exists = 0 THEN
                SELECT 0 AS success, 'Vendor not found' AS message;
            ELSE
                -- All validations passed - insert the payment
                SET v_now = NOW();
                INSERT INTO daily_payments (collector_id, vendor_id, amount, reference_no, status, time_date)
                VALUES (p_collector_id, p_vendor_id, p_amount, p_reference_no, p_status, v_now);

                SET v_receipt_id = LAST_INSERT_ID();

                -- Return created record with success flag
                SELECT
                    1 AS success,
                    'Daily payment created successfully' AS message,
                    dp.receipt_id,
                    dp.collector_id,
                    TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) AS collector_name,
                    dp.vendor_id,
                    TRIM(CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, ''))) AS vendor_name,
                    dp.amount,
                    dp.reference_no,
                    dp.status,
                    dp.time_date
                FROM daily_payments dp
                LEFT JOIN collector c ON dp.collector_id = c.collector_id
                LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
                WHERE dp.receipt_id = v_receipt_id
                LIMIT 1;
            END IF;
        END IF;
    END IF;
END;

-- Fix 6: updateDailyPayment
DROP PROCEDURE IF EXISTS updateDailyPayment;

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

    IF p_receipt_id IS NULL OR p_receipt_id <= 0 THEN
        SELECT 0 AS success, 'Receipt ID is required' AS message;
    ELSE
        SELECT COUNT(*) INTO v_exists FROM daily_payments WHERE receipt_id = p_receipt_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Daily payment not found' AS message;
        ELSE
            -- Optional validation for collector/vendor if provided
            IF p_collector_id IS NOT NULL THEN
                SELECT COUNT(*) INTO v_exists FROM collector WHERE collector_id = p_collector_id;
                IF v_exists = 0 THEN
                    SELECT 0 AS success, 'Collector not found' AS message;
                ELSE
                    -- Perform update
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
                        TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) AS collector_name,
                        dp.vendor_id,
                        TRIM(CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, ''))) AS vendor_name,
                        dp.amount,
                        dp.reference_no,
                        dp.status,
                        dp.time_date
                    FROM daily_payments dp
                    LEFT JOIN collector c ON dp.collector_id = c.collector_id
                    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
                    WHERE dp.receipt_id = p_receipt_id
                    LIMIT 1;
                END IF;
            ELSE
                -- Perform update without collector validation
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
                    TRIM(CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, ''))) AS collector_name,
                    dp.vendor_id,
                    TRIM(CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, ''))) AS vendor_name,
                    dp.amount,
                    dp.reference_no,
                    dp.status,
                    dp.time_date
                FROM daily_payments dp
                LEFT JOIN collector c ON dp.collector_id = c.collector_id
                LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
                WHERE dp.receipt_id = p_receipt_id
                LIMIT 1;
            END IF;
        END IF;
    END IF;
END;

-- Fix 7: deleteDailyPayment
DROP PROCEDURE IF EXISTS deleteDailyPayment;

CREATE PROCEDURE deleteDailyPayment(
    IN p_receipt_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    IF p_receipt_id IS NULL OR p_receipt_id <= 0 THEN
        SELECT 0 AS success, 'Receipt ID is required' AS message;
    ELSE
        SELECT COUNT(*) INTO v_exists FROM daily_payments WHERE receipt_id = p_receipt_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Daily payment not found' AS message;
        ELSE
            DELETE FROM daily_payments WHERE receipt_id = p_receipt_id;
            SELECT 1 AS success, 'Daily payment deleted successfully' AS message, p_receipt_id AS receipt_id;
        END IF;
    END IF;
END;
