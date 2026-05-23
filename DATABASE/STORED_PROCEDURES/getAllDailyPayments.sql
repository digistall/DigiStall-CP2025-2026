-- =====================================================
-- Stored Procedure: getAllDailyPayments
-- Description: Returns daily payments suitable for display in a table/grid
--              Includes collector and vendor display names
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS getAllDailyPayments //

CREATE PROCEDURE getAllDailyPayments()
BEGIN
    -- Return payments with readable collector and vendor names
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

DELIMITER ;

-- Usage:
-- CALL getAllDailyPayments();
