-- Migration: 247_updateStallholder.sql
-- Description: updateStallholder stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateStallholder`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateStallholder` (IN `p_stallholder_id` INT, IN `p_stallholder_name` VARCHAR(150), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(255), IN `p_address` TEXT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_stall_id` INT, IN `p_contract_start_date` DATE, IN `p_contract_end_date` DATE, IN `p_contract_status` ENUM('Active','Expired','Terminated'), IN `p_lease_amount` DECIMAL(10,2), IN `p_monthly_rent` DECIMAL(10,2), IN `p_payment_status` ENUM('current','overdue','grace_period'), IN `p_notes` TEXT)   BEGIN
    DECLARE old_stall_id INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    
    SELECT stall_id INTO old_stall_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
    
    
    UPDATE stallholder SET
        stallholder_name = COALESCE(p_stallholder_name, stallholder_name),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        address = COALESCE(p_address, address),
        business_name = COALESCE(p_business_name, business_name),
        business_type = COALESCE(p_business_type, business_type),
        stall_id = p_stall_id,
        contract_start_date = COALESCE(p_contract_start_date, contract_start_date),
        contract_end_date = COALESCE(p_contract_end_date, contract_end_date),
        contract_status = COALESCE(p_contract_status, contract_status),
        lease_amount = COALESCE(p_lease_amount, lease_amount),
        monthly_rent = COALESCE(p_monthly_rent, monthly_rent),
        payment_status = COALESCE(p_payment_status, payment_status),
        notes = COALESCE(p_notes, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE stallholder_id = p_stallholder_id;
    
    
    IF old_stall_id IS NOT NULL AND old_stall_id != p_stall_id THEN
        UPDATE stall 
        SET status = 'Active', is_available = 1 
        WHERE stall_id = old_stall_id;
    END IF;
    
    
    IF p_stall_id IS NOT NULL AND p_stall_id != old_stall_id THEN
        UPDATE stall 
        SET status = 'Occupied', is_available = 0 
        WHERE stall_id = p_stall_id;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder updated successfully' AS message, ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
