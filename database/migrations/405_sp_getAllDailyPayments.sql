-- Migration: 405_sp_getAllDailyPayments.sql
-- Description: Get all daily payments with collector and vendor names
-- Date: 2026-01-10

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllDailyPayments`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllDailyPayments`()
BEGIN
    SELECT 
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
    ORDER BY dp.time_date DESC, dp.receipt_id DESC;
END$$

DELIMITER ;
