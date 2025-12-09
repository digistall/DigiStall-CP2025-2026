-- Migration: 028_createStallholder.sql
-- Description: createStallholder stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createStallholder`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createStallholder` (IN `p_applicant_id` INT, IN `p_stallholder_name` VARCHAR(150), IN `p_contact_number` VARCHAR(20), IN `p_email` VARCHAR(255), IN `p_address` TEXT, IN `p_business_name` VARCHAR(255), IN `p_business_type` VARCHAR(100), IN `p_branch_id` INT, IN `p_stall_id` INT, IN `p_contract_start_date` DATE, IN `p_contract_end_date` DATE, IN `p_lease_amount` DECIMAL(10,2), IN `p_monthly_rent` DECIMAL(10,2), IN `p_notes` TEXT, IN `p_created_by_business_manager` INT)   BEGIN
    DECLARE new_stallholder_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    INSERT INTO `stallholder` (
        `applicant_id`, `stallholder_name`, `contact_number`, `email`, `address`,
        `business_name`, `business_type`, `branch_id`, `stall_id`,
        `contract_start_date`, `contract_end_date`, `contract_status`,
        `lease_amount`, `monthly_rent`, `payment_status`,
        `notes`, `created_by_business_manager`
    ) VALUES (
        p_applicant_id, p_stallholder_name, p_contact_number, p_email, p_address,
        p_business_name, p_business_type, p_branch_id, p_stall_id,
        p_contract_start_date, p_contract_end_date, 'Active',
        p_lease_amount, p_monthly_rent, 'current',
        p_notes, p_created_by_business_manager
    );
    
    SET new_stallholder_id = LAST_INSERT_ID();
    
    IF p_stall_id IS NOT NULL THEN
        UPDATE `stall` 
        SET `status` = 'Occupied', `is_available` = 0 
        WHERE `stall_id` = p_stall_id;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder created successfully' AS message, new_stallholder_id as stallholder_id;
END$$

DELIMITER ;
