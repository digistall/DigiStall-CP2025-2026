-- Migration: 134_sp_add_payment.sql
-- Description: sp_add_payment stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_add_payment`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_add_payment` (IN `p_stallholder_id` INT, IN `p_amount` DECIMAL(10,2), IN `p_payment_date` DATE, IN `p_payment_time` TIME, IN `p_payment_for_month` VARCHAR(7), IN `p_payment_type` ENUM('rental','utilities','maintenance','penalty','other'), IN `p_payment_method` ENUM('cash','gcash','maya','paymaya','bank_transfer','check'), IN `p_reference_number` VARCHAR(100), IN `p_collected_by_user_id` INT, IN `p_notes` TEXT)   BEGIN
    DECLARE payment_id INT;
    DECLARE collected_by_name VARCHAR(200);
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1
            @error_code = MYSQL_ERRNO,
            @error_message = MESSAGE_TEXT;
        SELECT CONCAT('Error: ', @error_code, ' - ', @error_message) as error_message;
    END;
    
    START TRANSACTION;
    
    -- Get collected by user name
    SELECT CONCAT(first_name, ' ', last_name) 
    INTO collected_by_name
    FROM user 
    WHERE user_id = p_collected_by_user_id;
    
    IF collected_by_name IS NULL THEN
        SET collected_by_name = 'System User';
    END IF;
    
    -- Insert the payment record
    INSERT INTO payment (
        stallholder_id,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        payment_method,
        reference_number,
        collected_by,
        collected_by_user_id,
        notes,
        payment_status,
        created_at,
        updated_at
    ) VALUES (
        p_stallholder_id,
        p_amount,
        p_payment_date,
        p_payment_time,
        p_payment_for_month,
        p_payment_type,
        p_payment_method,
        p_reference_number,
        collected_by_name,
        p_collected_by_user_id,
        p_notes,
        'completed',
        NOW(),
        NOW()
    );
    
    SET payment_id = LAST_INSERT_ID();
    
    -- Update stallholder payment status if needed
    UPDATE stallholder 
    SET payment_status = 'paid',
        updated_at = NOW()
    WHERE stallholder_id = p_stallholder_id;
    
    COMMIT;
    
    -- Return the payment ID and success message
    SELECT 
      payment_id as paymentId,
      'Payment added successfully' as message,
      p_reference_number as referenceNumber,
      collected_by_name as collectedBy;
  END$$

DELIMITER ;
