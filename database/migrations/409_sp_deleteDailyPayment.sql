-- Migration: 409_sp_deleteDailyPayment.sql
-- Description: Delete a daily payment record
-- Date: 2026-01-10

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteDailyPayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteDailyPayment`(
    IN p_receipt_id INT
)
BEGIN
    DECLARE v_affected_rows INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 AS success, 'Failed to delete daily payment' AS message;
    END;
    
    START TRANSACTION;
    
    -- Validate payment exists
    IF NOT EXISTS (SELECT 1 FROM daily_payment WHERE receipt_id = p_receipt_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Daily payment not found';
    END IF;
    
    -- Delete the payment
    DELETE FROM daily_payment WHERE receipt_id = p_receipt_id;
    
    SET v_affected_rows = ROW_COUNT();
    
    COMMIT;
    
    SELECT 
        1 AS success,
        'Daily payment deleted successfully' AS message,
        v_affected_rows AS affected_rows;
END$$

DELIMITER ;
