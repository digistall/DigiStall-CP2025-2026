-- =====================================================
-- Stored Procedure: getAllVendorsForDailyPayments
-- Description: Returns vendors for dropdowns (id + display name)
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

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

DELIMITER ;

-- Usage:
-- CALL getAllVendorsForDailyPayments();
