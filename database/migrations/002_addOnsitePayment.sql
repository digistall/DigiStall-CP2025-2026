-- Migration: 002_addOnsitePayment.sql
-- Description: Adds an onsite payment with late fee calculation
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `addOnsitePayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addOnsitePayment` (IN `p_stallholder_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_payment_date` DATE, IN `p_payment_time` TIME, IN `p_payment_for_month` VARCHAR(7), IN `p_payment_type` VARCHAR(50), IN `p_reference_number` VARCHAR(100), IN `p_collected_by` VARCHAR(100), IN `p_notes` TEXT, IN `p_branch_id` INT, IN `p_created_by` INT)   BEGIN
                DECLARE payment_id INT;
                DECLARE v_days_overdue INT DEFAULT 0;
                DECLARE v_late_fee DECIMAL(10,2) DEFAULT 0.00;
                DECLARE v_last_payment_date DATE;
                DECLARE v_monthly_rent DECIMAL(10,2);
                DECLARE v_total_amount DECIMAL(10,2);
                DECLARE v_notes TEXT;
                
                DECLARE EXIT HANDLER FOR SQLEXCEPTION
                BEGIN
                    ROLLBACK;
                    SELECT 0 as success, 'Payment processing failed' as message;
                END;
                
                START TRANSACTION;
                
                SELECT last_payment_date, monthly_rent
                INTO v_last_payment_date, v_monthly_rent
                FROM stallholder
                WHERE stallholder_id = p_stallholder_id;
                
                IF v_last_payment_date IS NOT NULL THEN
                    SET v_days_overdue = DATEDIFF(p_payment_date, v_last_payment_date) - 30;
                    IF v_days_overdue < 0 THEN
                        SET v_days_overdue = 0;
                    END IF;
                END IF;
                
                IF v_days_overdue > 0 THEN
                    SET v_late_fee = CEILING(v_days_overdue / 30) * 100.00;
                END IF;
                
                SET v_total_amount = p_amount + v_late_fee;
                
                SET v_notes = p_notes;
                IF v_late_fee > 0 THEN
                    SET v_notes = CONCAT(
                        COALESCE(p_notes, ''),
                        IF(p_notes IS NOT NULL AND p_notes != '', ' | ', ''),
                        'Late Fee: PHP ', FORMAT(v_late_fee, 2),
                        ' (', v_days_overdue, ' days overdue)'
                    );
                END IF;
                
                INSERT INTO payments (
                    stallholder_id, amount, payment_date, payment_time, payment_for_month,
                    payment_type, payment_method, reference_number, collected_by, notes,
                    payment_status, branch_id, created_by, created_at, updated_at
                ) VALUES (
                    p_stallholder_id, v_total_amount, p_payment_date, p_payment_time, p_payment_for_month,
                    p_payment_type, 'onsite', p_reference_number, p_collected_by, v_notes,
                    'completed', p_branch_id, p_created_by, NOW(), NOW()
                );
                
                SET payment_id = LAST_INSERT_ID();
                
                UPDATE stallholder
                SET last_payment_date = p_payment_date,
                    payment_status = 'paid',
                    updated_at = NOW()
                WHERE stallholder_id = p_stallholder_id;
                
                COMMIT;
                
                SELECT 
                    1 as success,
                    payment_id,
                    v_total_amount as amount_paid,
                    v_late_fee as late_fee,
                    v_days_overdue as days_overdue,
                    'Payment recorded successfully. Stallholder status updated to PAID.' as message;
            END$$

DELIMITER ;
