-- =====================================================
-- Stored Procedure: getDailyPaymentById
-- Description: Returns a single daily payment by receipt_id
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

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

DELIMITER ;

-- Usage:
-- CALL getDailyPaymentById(123);
