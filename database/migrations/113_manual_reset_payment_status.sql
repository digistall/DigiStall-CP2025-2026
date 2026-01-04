-- Migration: 113_manual_reset_payment_status.sql
-- Description: manual_reset_payment_status stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `manual_reset_payment_status`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `manual_reset_payment_status` ()   BEGIN
                DECLARE reset_count INT DEFAULT 0;
                
                SELECT COUNT(*) INTO reset_count
                FROM stallholder
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                UPDATE stallholder
                SET payment_status = 'pending',
                    updated_at = NOW()
                WHERE payment_status = 'paid'
                  AND contract_status = 'Active';
                
                INSERT INTO payment_status_log (
                    reset_date,
                    stallholders_reset_count,
                    reset_type,
                    notes
                ) VALUES (
                    CURDATE(),
                    reset_count,
                    'manual',
                    CONCAT('Manual reset by admin on ', DATE_FORMAT(NOW(), '%Y-%m-%d %H:%i:%s'))
                );
                
                SELECT 
                    reset_count as stallholders_reset,
                    'Payment statuses reset from paid to pending' as message;
            END$$

DELIMITER ;
