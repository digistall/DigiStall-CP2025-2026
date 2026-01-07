-- Migration: 169_sp_generate_receipt_number.sql
-- Description: sp_generate_receipt_number stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_generate_receipt_number`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_generate_receipt_number` ()   BEGIN
    DECLARE current_date_str VARCHAR(8);
    DECLARE last_reference VARCHAR(20);
    DECLARE sequence_number INT;
    DECLARE new_receipt_number VARCHAR(20);
    
    -- Get current date in YYYYMMDD format
    SET current_date_str = DATE_FORMAT(NOW(), '%Y%m%d');
    
    -- Get the last reference number for today from PAYMENTS table
    SELECT reference_number INTO last_reference
    FROM payments 
    WHERE reference_number LIKE CONCAT('RCP-', current_date_str, '%')
    ORDER BY reference_number DESC
    LIMIT 1;
    
    -- Extract sequence number and increment
    IF last_reference IS NOT NULL THEN
        SET sequence_number = CAST(SUBSTRING(last_reference, -3) AS UNSIGNED) + 1;
    ELSE
        SET sequence_number = 1;
    END IF;
    
    -- Ensure we don't exceed 999 payments per day
    IF sequence_number > 999 THEN
        SET sequence_number = 999;
    END IF;
    
    -- Generate new receipt number: RCP-YYYYMMDD-3-digit sequence
    SET new_receipt_number = CONCAT('RCP-', current_date_str, '-', LPAD(sequence_number, 3, '0'));
    
    SELECT new_receipt_number as receiptNumber, 'success' as status;
END$$

DELIMITER ;
