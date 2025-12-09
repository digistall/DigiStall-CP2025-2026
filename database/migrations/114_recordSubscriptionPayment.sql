-- Migration: 114_recordSubscriptionPayment.sql
-- Description: recordSubscriptionPayment stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `recordSubscriptionPayment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `recordSubscriptionPayment` (IN `p_subscription_id` INT, IN `p_business_owner_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_payment_date` DATE, IN `p_payment_method` VARCHAR(50), IN `p_reference_number` VARCHAR(100), IN `p_payment_period_start` DATE, IN `p_payment_period_end` DATE, IN `p_notes` TEXT, IN `p_processed_by_system_admin` INT)   BEGIN
    DECLARE v_payment_id INT;
    DECLARE v_receipt_number VARCHAR(100);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Error recording subscription payment';
    END;
    
    START TRANSACTION;
    
    -- Generate receipt number
    SET v_receipt_number = CONCAT('RCPT-', DATE_FORMAT(NOW(), '%Y%m%d'), '-', LPAD(FLOOR(RAND() * 9999), 4, '0'));
    
    -- Insert payment record
    INSERT INTO subscription_payments (
        subscription_id,
        business_owner_id,
        amount,
        payment_date,
        payment_method,
        payment_status,
        reference_number,
        receipt_number,
        payment_period_start,
        payment_period_end,
        notes,
        processed_by_system_admin
    ) VALUES (
        p_subscription_id,
        p_business_owner_id,
        p_amount,
        p_payment_date,
        p_payment_method,
        'Completed',
        p_reference_number,
        v_receipt_number,
        p_payment_period_start,
        p_payment_period_end,
        p_notes,
        p_processed_by_system_admin
    );
    
    SET v_payment_id = LAST_INSERT_ID();
    
    -- Update subscription status to Active
    UPDATE business_owner_subscriptions
    SET subscription_status = 'Active',
        end_date = p_payment_period_end
    WHERE subscription_id = p_subscription_id;
    
    -- Update business owner subscription info
    UPDATE stall_business_owner
    SET subscription_status = 'Active',
        subscription_expiry_date = p_payment_period_end,
        last_payment_date = p_payment_date
    WHERE business_owner_id = p_business_owner_id;
    
    COMMIT;
    
    -- Return payment details
    SELECT 
        v_payment_id as payment_id,
        v_receipt_number as receipt_number,
        'Payment recorded successfully' as message;
END$$

DELIMITER ;
