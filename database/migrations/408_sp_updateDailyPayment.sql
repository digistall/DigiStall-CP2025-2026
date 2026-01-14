-- Migration: 408_sp_updateDailyPayment.sql
-- Description: Update an existing daily payment record
-- Date: 2026-01-10

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateDailyPayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateDailyPayment`(
    IN p_receipt_id INT,
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(20),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 AS success, 'Failed to update daily payment' AS message;
    END;
    
    START TRANSACTION;
    
    -- Validate payment exists
    IF NOT EXISTS (SELECT 1 FROM daily_payment WHERE receipt_id = p_receipt_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Daily payment not found';
    END IF;
    
    -- Validate collector exists (if provided)
    IF p_collector_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM collector WHERE collector_id = p_collector_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Collector not found';
    END IF;
    
    -- Validate vendor exists (if provided)
    IF p_vendor_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM vendor WHERE vendor_id = p_vendor_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Vendor not found';
    END IF;
    
    -- Validate amount (if provided)
    IF p_amount IS NOT NULL AND p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Amount must be greater than 0';
    END IF;
    
    -- Update daily payment
    UPDATE daily_payment
    SET 
        collector_id = COALESCE(p_collector_id, collector_id),
        vendor_id = COALESCE(p_vendor_id, vendor_id),
        amount = COALESCE(p_amount, amount),
        reference_no = COALESCE(p_reference_no, reference_no),
        status = COALESCE(p_status, status)
    WHERE receipt_id = p_receipt_id;
    
    COMMIT;
    
    -- Return the updated payment
    SELECT 
        1 AS success,
        'Daily payment updated successfully' AS message,
        dp.receipt_id,
        dp.collector_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS collector_name,
        dp.vendor_id,
        CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, '')) AS vendor_name,
        dp.amount,
        dp.reference_no,
        dp.status,
        dp.time_date
    FROM daily_payment dp
    LEFT JOIN collector c ON dp.collector_id = c.collector_id
    LEFT JOIN vendor v ON dp.vendor_id = v.vendor_id
    WHERE dp.receipt_id = p_receipt_id;
END$$

DELIMITER ;
