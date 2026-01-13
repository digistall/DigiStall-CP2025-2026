-- Migration: 406_sp_getDailyPaymentById.sql
-- Description: Get a single daily payment by receipt ID
-- Date: 2026-01-10

DELIMITER $$

DROP PROCEDURE IF EXISTS `getDailyPaymentById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDailyPaymentById`(
    IN p_receipt_id INT
)
BEGIN
    SELECT 
        dp.receipt_id,
        dp.collector_id,
        CONCAT(COALESCE(c.first_name, ''), ' ', COALESCE(c.last_name, '')) AS collector_name,
        c.email AS collector_email,
        c.contact_number AS collector_contact,
        dp.vendor_id,
        CONCAT(COALESCE(v.first_name, ''), ' ', COALESCE(v.last_name, '')) AS vendor_name,
        v.email AS vendor_email,
        v.contact_number AS vendor_contact,
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
