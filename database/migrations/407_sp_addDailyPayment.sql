-- Migration: 407_sp_addDailyPayment.sql
-- Description: Add a new daily payment record
-- Date: 2026-01-10

DELIMITER $$

DROP PROCEDURE IF EXISTS `addDailyPayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addDailyPayment`(
    IN p_collector_id INT,
    IN p_vendor_id INT,
    IN p_amount DECIMAL(10,2),
    IN p_reference_no VARCHAR(20),
    IN p_status VARCHAR(45)
)
BEGIN
    DECLARE v_receipt_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 AS success, 'Failed to add daily payment' AS message;
    END;
    
    START TRANSACTION;
    
    -- Validate collector exists
    IF NOT EXISTS (SELECT 1 FROM collector WHERE collector_id = p_collector_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Collector not found';
    END IF;
    
    -- Validate vendor exists
    IF NOT EXISTS (SELECT 1 FROM vendor WHERE vendor_id = p_vendor_id) THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Vendor not found';
    END IF;
    
    -- Validate amount
    IF p_amount <= 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Amount must be greater than 0';
    END IF;
    
    -- Insert daily payment
    INSERT INTO daily_payment (
        collector_id,
        vendor_id,
        amount,
        reference_no,
        status,
        time_date
    ) VALUES (
        p_collector_id,
        p_vendor_id,
        p_amount,
        p_reference_no,
        COALESCE(p_status, 'completed'),
        NOW()
    );
    
    SET v_receipt_id = LAST_INSERT_ID();
    
    COMMIT;
    
    -- Return the newly created payment
    SELECT 
        1 AS success,
        'Daily payment added successfully' AS message,
        v_receipt_id AS receipt_id,
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
    WHERE dp.receipt_id = v_receipt_id;
END$$

DELIMITER ;
