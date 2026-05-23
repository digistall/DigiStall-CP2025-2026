-- =====================================================
-- Stored Procedure: getAllCollectorsForDailyPayments
-- Description: Returns collectors for dropdowns (id + display name)
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS getAllCollectorsForDailyPayments //

CREATE PROCEDURE getAllCollectorsForDailyPayments()
BEGIN
    SELECT
        c.collector_id,
        c.first_name,
        c.last_name
    FROM collector c
    WHERE c.is_active IS NULL OR c.is_active = 1
    ORDER BY c.collector_id;
END //

DELIMITER ;

-- Usage:
-- CALL getAllCollectorsForDailyPayments();
