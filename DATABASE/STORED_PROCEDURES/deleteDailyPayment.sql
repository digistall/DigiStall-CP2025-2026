-- =====================================================
-- Stored Procedure: deleteDailyPayment
-- Description: Deletes a daily payment by receipt_id and returns status
-- Author: auto-generated
-- Date: 2026-03-04
-- =====================================================

DELIMITER //

DROP PROCEDURE IF EXISTS deleteDailyPayment //

CREATE PROCEDURE deleteDailyPayment(
    IN p_receipt_id INT
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

    DELETE FROM daily_payments WHERE receipt_id = p_receipt_id;

    SELECT 1 AS success, 'Daily payment deleted successfully' AS message, p_receipt_id AS receipt_id;

    proc_end: BEGIN
    END;
END //

DELIMITER ;

-- Usage:
-- CALL deleteDailyPayment(123);
