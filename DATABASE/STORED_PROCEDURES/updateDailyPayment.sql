-- =====================================================
-- Stored Procedure: updateDailyPayment
-- Description: Updates an existing daily payment and returns status
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS updateDailyPayment //

CREATE PROCEDURE updateDailyPayment(
    IN p_receipt_id INT,
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(45),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;

    IF p_receipt_id IS NULL OR p_receipt_id <= 0 THEN
        SELECT 0 AS success, 'Receipt ID is required' AS message;
        LEAVE proc_end;
    END IF;

    SELECT COUNT(*) INTO v_exists FROM daily_payments WHERE receipt_id = p_receipt_id;
    IF v_exists = 0 THEN
        SELECT 0 AS success, 'Daily payment not found' AS message;
        LEAVE proc_end;
    END IF;

    -- Optional validation for collector/vendor if provided
    IF p_collector_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_exists FROM collector WHERE collector_id = p_collector_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Collector not found' AS message;
            LEAVE proc_end;
        END IF;
    END IF;

    IF p_vendor_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_exists FROM vendor WHERE vendor_id = p_vendor_id;
        IF v_exists = 0 THEN
            SELECT 0 AS success, 'Vendor not found' AS message;
            LEAVE proc_end;
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

    proc_end: BEGIN
    END;
END //

DELIMITER ;

-- Usage:
-- CALL updateDailyPayment(123, NULL, NULL, 175.00, 'REF-002', 'completed');
