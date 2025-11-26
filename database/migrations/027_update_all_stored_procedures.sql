-- Migration 027: Update All Stored Procedures with New Role Names
-- Purpose: Update all existing procedures to use renamed tables
-- Date: 2025-11-26
-- Version: 1.0.0

DELIMITER $$

-- =====================================================================
-- UPDATE BRANCH PROCEDURES
-- =====================================================================

DROP PROCEDURE IF EXISTS `createBranch`$$
CREATE PROCEDURE `createBranch`(
    IN `p_business_owner_id` INT,
    IN `p_branch_name` VARCHAR(100),
    IN `p_area` VARCHAR(100),
    IN `p_location` VARCHAR(255),
    IN `p_address` TEXT,
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(100),
    IN `p_status` ENUM('Active','Inactive','Under Construction','Maintenance')
)
BEGIN
    INSERT INTO `branch` (
        `business_owner_id`, 
        `branch_name`, 
        `area`, 
        `location`, 
        `address`, 
        `contact_number`, 
        `email`, 
        `status`
    )
    VALUES (
        p_business_owner_id, 
        p_branch_name, 
        p_area, 
        p_location, 
        p_address, 
        p_contact_number, 
        p_email, 
        COALESCE(p_status, 'Active')
    );
    
    SELECT LAST_INSERT_ID() as branch_id;
END$$

DROP PROCEDURE IF EXISTS `getAllBranchesDetailed`$$
CREATE PROCEDURE `getAllBranchesDetailed`()
BEGIN
    SELECT 
        b.`branch_id`,
        b.`business_owner_id`,
        b.`branch_name`,
        b.`area`,
        b.`location`,
        b.`address`,
        b.`contact_number`,
        b.`email`,
        b.`status`,
        b.`created_at`,
        b.`updated_at`,
        bm.`business_manager_id` as manager_id,
        bm.`manager_username`,
        CONCAT(bm.`first_name`, ' ', bm.`last_name`) as manager_name,
        CASE 
            WHEN bm.`business_manager_id` IS NOT NULL THEN TRUE 
            ELSE FALSE 
        END as manager_assigned,
        bm.`email` as manager_email,
        bm.`contact_number` as manager_contact,
        bm.`status` as manager_status
    FROM `branch` b
    LEFT JOIN `business_manager` bm ON b.`branch_id` = bm.`branch_id` AND bm.`status` = 'Active'
    ORDER BY b.`branch_name`;
END$$

-- =====================================================================
-- UPDATE BUSINESS MANAGER PROCEDURES (formerly branch_manager)
-- =====================================================================

DROP PROCEDURE IF EXISTS `getBranchManagerByUsername`$$
DROP PROCEDURE IF EXISTS `getBusinessManagerByUsername`$$
CREATE PROCEDURE `getBusinessManagerByUsername`(
    IN `p_username` VARCHAR(50)
)
BEGIN
    SELECT 
        bm.*,
        b.`branch_name`,
        b.`area`,
        b.`location`
    FROM `business_manager` bm
    LEFT JOIN `branch` b ON bm.`branch_id` = b.`branch_id`
    WHERE bm.`manager_username` = p_username AND bm.`status` = 'Active';
END$$

DROP PROCEDURE IF EXISTS `updateBranchManager`$$
DROP PROCEDURE IF EXISTS `updateBusinessManager`$$
CREATE PROCEDURE `updateBusinessManager`(
    IN `p_manager_id` INT,
    IN `p_first_name` VARCHAR(50),
    IN `p_last_name` VARCHAR(50),
    IN `p_email` VARCHAR(100),
    IN `p_contact_number` VARCHAR(20),
    IN `p_status` ENUM('Active','Inactive')
)
BEGIN
    UPDATE `business_manager`
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `email` = COALESCE(p_email, `email`),
        `contact_number` = COALESCE(p_contact_number, `contact_number`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_manager_id` = p_manager_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================================
-- UPDATE BUSINESS EMPLOYEE PROCEDURES (formerly employee)
-- =====================================================================

DROP PROCEDURE IF EXISTS `createEmployee`$$
DROP PROCEDURE IF EXISTS `createBusinessEmployee`$$
CREATE PROCEDURE `createBusinessEmployee`(
    IN `p_username` VARCHAR(20),
    IN `p_password_hash` VARCHAR(255),
    IN `p_first_name` VARCHAR(100),
    IN `p_last_name` VARCHAR(100),
    IN `p_email` VARCHAR(255),
    IN `p_phone_number` VARCHAR(20),
    IN `p_branch_id` INT,
    IN `p_created_by_manager` INT,
    IN `p_permissions` JSON
)
BEGIN
    INSERT INTO `business_employee` (
        `employee_username`, `employee_password_hash`, `first_name`, `last_name`, `email`, 
        `phone_number`, `branch_id`, `created_by_manager`, `permissions`, `status`, `password_reset_required`
    )
    VALUES (
        p_username, p_password_hash, p_first_name, p_last_name, p_email, 
        p_phone_number, p_branch_id, p_created_by_manager, p_permissions, 'Active', true
    );
    
    SELECT LAST_INSERT_ID() as business_employee_id;
END$$

DROP PROCEDURE IF EXISTS `getEmployeeById`$$
DROP PROCEDURE IF EXISTS `getBusinessEmployeeById`$$
CREATE PROCEDURE `getBusinessEmployeeById`(
    IN `p_employee_id` INT
)
BEGIN
    SELECT 
        e.*,
        b.`branch_name`,
        bm.`first_name` as created_by_first_name,
        bm.`last_name` as created_by_last_name
    FROM `business_employee` e
    LEFT JOIN `branch` b ON e.`branch_id` = b.`branch_id`
    LEFT JOIN `business_manager` bm ON e.`created_by_manager` = bm.`business_manager_id`
    WHERE e.`business_employee_id` = p_employee_id;
END$$

DROP PROCEDURE IF EXISTS `getEmployeeByUsername`$$
DROP PROCEDURE IF EXISTS `getBusinessEmployeeByUsername`$$
CREATE PROCEDURE `getBusinessEmployeeByUsername`(
    IN `p_username` VARCHAR(20)
)
BEGIN
    SELECT 
        e.*,
        b.`branch_name`
    FROM `business_employee` e
    LEFT JOIN `branch` b ON e.`branch_id` = b.`branch_id`
    WHERE e.`employee_username` = p_username;
END$$

DROP PROCEDURE IF EXISTS `getAllEmployees`$$
DROP PROCEDURE IF EXISTS `getAllBusinessEmployees`$$
CREATE PROCEDURE `getAllBusinessEmployees`(
    IN `p_status` VARCHAR(20),
    IN `p_branch_id` INT,
    IN `p_limit` INT,
    IN `p_offset` INT
)
BEGIN
    SET @sql = 'SELECT 
        e.business_employee_id,
        e.employee_username,
        e.first_name,
        e.last_name,
        e.email,
        e.phone_number,
        e.branch_id,
        e.permissions,
        e.status,
        e.last_login,
        e.created_at,
        b.branch_name
    FROM business_employee e
    LEFT JOIN branch b ON e.branch_id = b.branch_id';
    
    SET @where_conditions = '';
    
    IF p_status IS NOT NULL THEN
        SET @where_conditions = CONCAT(@where_conditions, ' AND e.status = "', p_status, '"');
    END IF;
    
    IF p_branch_id IS NOT NULL THEN
        SET @where_conditions = CONCAT(@where_conditions, ' AND e.branch_id = ', p_branch_id);
    END IF;
    
    IF LENGTH(@where_conditions) > 0 THEN
        SET @sql = CONCAT(@sql, ' WHERE ', SUBSTRING(@where_conditions, 6));
    END IF;
    
    SET @sql = CONCAT(@sql, ' ORDER BY e.created_at DESC');
    
    IF p_limit IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' LIMIT ', p_limit);
        IF p_offset IS NOT NULL THEN
            SET @sql = CONCAT(@sql, ' OFFSET ', p_offset);
        END IF;
    END IF;
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END$$

DROP PROCEDURE IF EXISTS `getEmployeesByBranch`$$
DROP PROCEDURE IF EXISTS `getBusinessEmployeesByBranch`$$
CREATE PROCEDURE `getBusinessEmployeesByBranch`(
    IN `p_branch_id` INT,
    IN `p_status` VARCHAR(20)
)
BEGIN
    IF p_status IS NOT NULL THEN
        SELECT 
            e.`business_employee_id`,
            e.`employee_username`,
            e.`first_name`,
            e.`last_name`,
            e.`email`,
            e.`permissions`,
            e.`status`,
            e.`last_login`,
            e.`created_at`
        FROM `business_employee` e
        WHERE e.`branch_id` = p_branch_id AND e.`status` = p_status
        ORDER BY e.`first_name`, e.`last_name`;
    ELSE
        SELECT 
            e.`business_employee_id`,
            e.`employee_username`,
            e.`first_name`,
            e.`last_name`,
            e.`email`,
            e.`permissions`,
            e.`status`,
            e.`last_login`,
            e.`created_at`
        FROM `business_employee` e
        WHERE e.`branch_id` = p_branch_id
        ORDER BY e.`first_name`, e.`last_name`;
    END IF;
END$$

DROP PROCEDURE IF EXISTS `updateEmployee`$$
DROP PROCEDURE IF EXISTS `updateBusinessEmployee`$$
CREATE PROCEDURE `updateBusinessEmployee`(
    IN `p_employee_id` INT,
    IN `p_first_name` VARCHAR(100),
    IN `p_last_name` VARCHAR(100),
    IN `p_email` VARCHAR(255),
    IN `p_phone_number` VARCHAR(20),
    IN `p_permissions` JSON,
    IN `p_status` VARCHAR(20)
)
BEGIN
    UPDATE `business_employee` 
    SET 
        `first_name` = COALESCE(p_first_name, `first_name`),
        `last_name` = COALESCE(p_last_name, `last_name`),
        `email` = COALESCE(p_email, `email`),
        `phone_number` = COALESCE(p_phone_number, `phone_number`),
        `permissions` = COALESCE(p_permissions, `permissions`),
        `status` = COALESCE(p_status, `status`),
        `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DROP PROCEDURE IF EXISTS `deleteEmployee`$$
DROP PROCEDURE IF EXISTS `deleteBusinessEmployee`$$
CREATE PROCEDURE `deleteBusinessEmployee`(
    IN `p_employee_id` INT
)
BEGIN
    UPDATE `business_employee` 
    SET `status` = 'Inactive', `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    -- Terminate all active sessions
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `business_employee_id` = p_employee_id AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DROP PROCEDURE IF EXISTS `loginEmployee`$$
DROP PROCEDURE IF EXISTS `loginBusinessEmployee`$$
CREATE PROCEDURE `loginBusinessEmployee`(
    IN `p_username` VARCHAR(20),
    IN `p_session_token` VARCHAR(255),
    IN `p_ip_address` VARCHAR(45),
    IN `p_user_agent` TEXT
)
BEGIN
    DECLARE v_employee_id INT DEFAULT NULL;
    
    -- Get employee ID
    SELECT `business_employee_id` INTO v_employee_id 
    FROM `business_employee` 
    WHERE `employee_username` = p_username AND `status` = 'Active';
    
    IF v_employee_id IS NOT NULL THEN
        -- Create session
        INSERT INTO `employee_session` (`business_employee_id`, `session_token`, `ip_address`, `user_agent`, `is_active`)
        VALUES (v_employee_id, p_session_token, p_ip_address, p_user_agent, true);
        
        -- Update last login
        UPDATE `business_employee` SET `last_login` = NOW() WHERE `business_employee_id` = v_employee_id;
        
        SELECT v_employee_id as business_employee_id, 'success' as status;
    ELSE
        SELECT NULL as business_employee_id, 'failed' as status;
    END IF;
END$$

DROP PROCEDURE IF EXISTS `logoutEmployee`$$
DROP PROCEDURE IF EXISTS `logoutBusinessEmployee`$$
CREATE PROCEDURE `logoutBusinessEmployee`(
    IN `p_session_token` VARCHAR(255)
)
BEGIN
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `session_token` = p_session_token AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DROP PROCEDURE IF EXISTS `resetEmployeePassword`$$
DROP PROCEDURE IF EXISTS `resetBusinessEmployeePassword`$$
CREATE PROCEDURE `resetBusinessEmployeePassword`(
    IN `p_employee_id` INT,
    IN `p_new_password_hash` VARCHAR(255),
    IN `p_reset_by` INT
)
BEGIN
    UPDATE `business_employee` 
    SET 
        `employee_password_hash` = p_new_password_hash,
        `password_reset_required` = true,
        `updated_at` = NOW()
    WHERE `business_employee_id` = p_employee_id;
    
    -- Terminate all active sessions
    UPDATE `employee_session` 
    SET `is_active` = false, `logout_time` = NOW()
    WHERE `business_employee_id` = p_employee_id AND `is_active` = true;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- =====================================================================
-- UPDATE STALLHOLDER PROCEDURES
-- =====================================================================

DROP PROCEDURE IF EXISTS `createStallholder`$$
CREATE PROCEDURE `createStallholder`(
    IN `p_applicant_id` INT,
    IN `p_stallholder_name` VARCHAR(150),
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(255),
    IN `p_address` TEXT,
    IN `p_business_name` VARCHAR(255),
    IN `p_business_type` VARCHAR(100),
    IN `p_branch_id` INT,
    IN `p_stall_id` INT,
    IN `p_contract_start_date` DATE,
    IN `p_contract_end_date` DATE,
    IN `p_lease_amount` DECIMAL(10,2),
    IN `p_monthly_rent` DECIMAL(10,2),
    IN `p_notes` TEXT,
    IN `p_created_by_business_manager` INT
)
BEGIN
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

DROP PROCEDURE IF EXISTS `getAllStallholdersDetailed`$$
CREATE PROCEDURE `getAllStallholdersDetailed`(
    IN `p_branch_id` INT
)
BEGIN
    IF p_branch_id IS NULL THEN
        SELECT
            sh.`stallholder_id`,
            sh.`applicant_id`,
            sh.`stallholder_name`,
            sh.`contact_number`,
            sh.`email`,
            sh.`address`,
            sh.`business_name`,
            sh.`business_type`,
            sh.`branch_id`,
            b.`branch_name`,
            sh.`stall_id`,
            s.`stall_no`,
            s.`stall_location`,
            sh.`contract_start_date`,
            sh.`contract_end_date`,
            sh.`contract_status`,
            sh.`lease_amount`,
            sh.`monthly_rent`,
            sh.`payment_status`,
            sh.`last_payment_date`,
            sh.`compliance_status`,
            sh.`last_violation_date`,
            sh.`notes`,
            sh.`date_created`,
            sh.`updated_at`,
            CONCAT(bm.`first_name`, ' ', bm.`last_name`) as created_by_name
        FROM `stallholder` sh
        INNER JOIN `branch` b ON sh.`branch_id` = b.`branch_id`
        INNER JOIN `stall` s ON sh.`stall_id` = s.`stall_id`
        LEFT JOIN `business_manager` bm ON sh.`created_by_business_manager` = bm.`business_manager_id`
        WHERE sh.`stall_id` IS NOT NULL
        ORDER BY sh.`date_created` DESC;
    ELSE
        SELECT
            sh.`stallholder_id`,
            sh.`applicant_id`,
            sh.`stallholder_name`,
            sh.`contact_number`,
            sh.`email`,
            sh.`address`,
            sh.`business_name`,
            sh.`business_type`,
            sh.`branch_id`,
            b.`branch_name`,
            sh.`stall_id`,
            s.`stall_no`,
            s.`stall_location`,
            sh.`contract_start_date`,
            sh.`contract_end_date`,
            sh.`contract_status`,
            sh.`lease_amount`,
            sh.`monthly_rent`,
            sh.`payment_status`,
            sh.`last_payment_date`,
            sh.`compliance_status`,
            sh.`last_violation_date`,
            sh.`notes`,
            sh.`date_created`,
            sh.`updated_at`,
            CONCAT(bm.`first_name`, ' ', bm.`last_name`) as created_by_name
        FROM `stallholder` sh
        INNER JOIN `branch` b ON sh.`branch_id` = b.`branch_id`
        INNER JOIN `stall` s ON sh.`stall_id` = s.`stall_id`
        LEFT JOIN `business_manager` bm ON sh.`created_by_business_manager` = bm.`business_manager_id`
        WHERE sh.`branch_id` = p_branch_id AND sh.`stall_id` IS NOT NULL
        ORDER BY sh.`date_created` DESC;
    END IF;
END$$

DROP PROCEDURE IF EXISTS `getStallholderById`$$
CREATE PROCEDURE `getStallholderById`(
    IN `p_stallholder_id` INT
)
BEGIN
    SELECT 
        sh.`stallholder_id`,
        sh.`applicant_id`,
        sh.`stallholder_name`,
        sh.`contact_number`,
        sh.`email`,
        sh.`address`,
        sh.`business_name`,
        sh.`business_type`,
        sh.`branch_id`,
        b.`branch_name`,
        sh.`stall_id`,
        s.`stall_no`,
        s.`stall_location`,
        sh.`contract_start_date`,
        sh.`contract_end_date`,
        sh.`contract_status`,
        sh.`lease_amount`,
        sh.`monthly_rent`,
        sh.`payment_status`,
        sh.`last_payment_date`,
        sh.`compliance_status`,
        sh.`last_violation_date`,
        sh.`notes`,
        sh.`date_created`,
        sh.`updated_at`,
        CONCAT(bm.`first_name`, ' ', bm.`last_name`) as created_by_name,
        a.`applicant_full_name`,
        a.`applicant_contact_number`,
        a.`applicant_address`,
        a.`applicant_birthdate`,
        a.`applicant_civil_status`,
        a.`applicant_educational_attainment`
    FROM `stallholder` sh
    LEFT JOIN `branch` b ON sh.`branch_id` = b.`branch_id`
    LEFT JOIN `stall` s ON sh.`stall_id` = s.`stall_id`
    LEFT JOIN `business_manager` bm ON sh.`created_by_business_manager` = bm.`business_manager_id`
    LEFT JOIN `applicant` a ON sh.`applicant_id` = a.`applicant_id`
    WHERE sh.`stallholder_id` = p_stallholder_id;
END$$

DELIMITER ;

-- =====================================================================
-- RECORD MIGRATION
-- =====================================================================

INSERT INTO `migrations` (`migration_name`, `version`, `executed_at`)
VALUES ('027_update_all_stored_procedures', '1.0.0', NOW());

SELECT '✅ Migration 027: All Stored Procedures updated with new role names!' AS status;
