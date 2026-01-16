-- ========================================
-- DATABASE RESTORE SCRIPT
-- Reverts database to clean state before encryption changes
-- ========================================
-- This script was generated to restore the database from commit 0999742
-- which is the last clean state before encryption was introduced
-- ========================================

-- SET THE DATABASE
USE naga_stall;

-- ========================================
-- STEP 1: Drop all encryption-related stored procedures
-- ========================================

-- Drop encryption support procedures
DROP PROCEDURE IF EXISTS sp_encrypt_data;
DROP PROCEDURE IF EXISTS sp_decrypt_data;
DROP PROCEDURE IF EXISTS sp_encrypt_field;
DROP PROCEDURE IF EXISTS sp_decrypt_field;
DROP PROCEDURE IF EXISTS sp_data_encryption;
DROP PROCEDURE IF EXISTS sp_encrypted_user_operations;
DROP PROCEDURE IF EXISTS sp_encrypted_staff_direct;
DROP PROCEDURE IF EXISTS sp_decryption_for_frontend;
DROP PROCEDURE IF EXISTS sp_decryption_critical_procedures;
DROP PROCEDURE IF EXISTS sp_decryption_compliance_payments;
DROP PROCEDURE IF EXISTS sp_decrypt_on_the_fly;

-- Drop encryption fix procedures
DROP PROCEDURE IF EXISTS fix_encrypted_columns;
DROP PROCEDURE IF EXISTS fix_stall_overview_return_raw_encrypted;
DROP PROCEDURE IF EXISTS mobile_decryption_and_spouse_encryption;
DROP PROCEDURE IF EXISTS verify_fix_mobile_decryption;
DROP PROCEDURE IF EXISTS return_encrypted_fields_for_backend;
DROP PROCEDURE IF EXISTS complete_mobile_decryption_fix;
DROP PROCEDURE IF EXISTS encrypt_spouse_data;
DROP PROCEDURE IF EXISTS mobile_sql_decryption;
DROP PROCEDURE IF EXISTS fix_collector_inspector_encryption;
DROP PROCEDURE IF EXISTS complete_decryption_fix;
DROP PROCEDURE IF EXISTS fix_all_encryption_issues;
DROP PROCEDURE IF EXISTS fix_manager_employee_decryption;
DROP PROCEDURE IF EXISTS fix_inspector_collector_login_and_encryption;
DROP PROCEDURE IF EXISTS encrypt_inspector_collector_data;
DROP PROCEDURE IF EXISTS encrypt_inspector_collector_complete;
DROP PROCEDURE IF EXISTS proper_encryption;
DROP PROCEDURE IF EXISTS encrypt_inspector_collector_like_applicant;
DROP PROCEDURE IF EXISTS fix_encrypted_data_with_real_names;
DROP PROCEDURE IF EXISTS fix_encryption_alter_columns;
DROP PROCEDURE IF EXISTS revert_to_varchar_nodejs_encryption;
DROP PROCEDURE IF EXISTS encrypt_inspector_collector;
DROP PROCEDURE IF EXISTS fix_complaint_decryption;
DROP PROCEDURE IF EXISTS fix_createBusinessEmployee_encryption;
DROP PROCEDURE IF EXISTS update_getBusinessEmployeeById_decryption;
DROP PROCEDURE IF EXISTS update_employee_list_decryption;
DROP PROCEDURE IF EXISTS fix_inspector_encryption;
DROP PROCEDURE IF EXISTS fix_collector_encryption;
DROP PROCEDURE IF EXISTS set_encryption_flag_for_old_data;
DROP PROCEDURE IF EXISTS update_mobile_login_decryption;
DROP PROCEDURE IF EXISTS decrypt_violation_history_inspector;
DROP PROCEDURE IF EXISTS decrypt_masked_data;
DROP PROCEDURE IF EXISTS update_columns_for_encryption;

-- ========================================
-- STEP 2: Remove is_encrypted columns if they exist
-- ========================================

-- These ALTER statements will fail silently if columns don't exist
-- We're using a procedure to handle this safely

DELIMITER $$

DROP PROCEDURE IF EXISTS remove_encryption_columns$$

CREATE PROCEDURE remove_encryption_columns()
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    
    -- Remove is_encrypted from inspector
    SET @sql = 'ALTER TABLE inspector DROP COLUMN IF EXISTS is_encrypted';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Remove is_encrypted from collector
    SET @sql = 'ALTER TABLE collector DROP COLUMN IF EXISTS is_encrypted';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Remove is_encrypted from applicant  
    SET @sql = 'ALTER TABLE applicant DROP COLUMN IF EXISTS is_encrypted';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Remove is_encrypted from stallholder
    SET @sql = 'ALTER TABLE stallholder DROP COLUMN IF EXISTS is_encrypted';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Remove is_encrypted from business_employee
    SET @sql = 'ALTER TABLE business_employee DROP COLUMN IF EXISTS is_encrypted';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    -- Remove is_encrypted from spouse
    SET @sql = 'ALTER TABLE spouse DROP COLUMN IF EXISTS is_encrypted';
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
    
    SELECT 'Encryption columns removal attempted' AS status;
END$$

DELIMITER ;

CALL remove_encryption_columns();
DROP PROCEDURE IF EXISTS remove_encryption_columns;

-- ========================================
-- STEP 3: Restore original addInspector procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS addInspector;

DELIMITER $$

CREATE PROCEDURE `addInspector` (
    IN `p_first_name` VARCHAR(100), 
    IN `p_last_name` VARCHAR(100), 
    IN `p_email` VARCHAR(255), 
    IN `p_contact_no` VARCHAR(20), 
    IN `p_password_plain` VARCHAR(255), 
    IN `p_branch_id` INT, 
    IN `p_date_hired` DATE, 
    IN `p_branch_manager_id` INT
)
BEGIN
    DECLARE new_inspector_id INT;

    INSERT INTO inspector (first_name, last_name, email, contact_no, password, date_hired, status)
    VALUES (p_first_name, p_last_name, p_email, p_contact_no, SHA2(p_password_plain, 256), IFNULL(p_date_hired, CURRENT_DATE), 'active');

    SET new_inspector_id = LAST_INSERT_ID();

    INSERT INTO inspector_assignment (inspector_id, branch_id, start_date, status, remarks)
    VALUES (new_inspector_id, p_branch_id, CURRENT_DATE, 'Active', 'Newly hired inspector');

    INSERT INTO inspector_action_log (inspector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (new_inspector_id, p_branch_id, p_branch_manager_id, 'New Hire', NOW(),
            CONCAT('Inspector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id));

    SELECT CONCAT('Inspector ', p_first_name, ' ', p_last_name, ' successfully added and logged as New Hire under branch ID ', p_branch_id) AS message;
END$$

DELIMITER ;

-- ========================================
-- STEP 4: Restore original createCollector procedure (without encryption)  
-- ========================================

DROP PROCEDURE IF EXISTS createCollector;

DELIMITER $$

CREATE PROCEDURE `createCollector` (
    IN `p_first_name` VARCHAR(100),
    IN `p_last_name` VARCHAR(100),
    IN `p_email` VARCHAR(255),
    IN `p_contact_no` VARCHAR(20),
    IN `p_password_plain` VARCHAR(255),
    IN `p_branch_id` INT,
    IN `p_date_hired` DATE,
    IN `p_branch_manager_id` INT
)
BEGIN
    DECLARE new_collector_id INT;

    INSERT INTO collector (first_name, last_name, email, contact_no, password, date_hired, status)
    VALUES (p_first_name, p_last_name, p_email, p_contact_no, SHA2(p_password_plain, 256), IFNULL(p_date_hired, CURRENT_DATE), 'active');

    SET new_collector_id = LAST_INSERT_ID();

    INSERT INTO collector_assignment (collector_id, branch_id, start_date, status, remarks)
    VALUES (new_collector_id, p_branch_id, CURRENT_DATE, 'Active', 'Newly hired collector');

    INSERT INTO collector_action_log (collector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (new_collector_id, p_branch_id, p_branch_manager_id, 'New Hire', NOW(),
            CONCAT('Collector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id));

    SELECT new_collector_id AS collector_id, 
           CONCAT('Collector ', p_first_name, ' ', p_last_name, ' successfully added') AS message;
END$$

DELIMITER ;

-- ========================================
-- STEP 5: Restore mobile staff login procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS sp_mobileStaffLogin;

DELIMITER $$

CREATE PROCEDURE `sp_mobileStaffLogin`(
    IN p_username VARCHAR(255),
    IN p_password VARCHAR(255),
    IN p_role VARCHAR(50)
)
BEGIN
    DECLARE v_user_id INT DEFAULT NULL;
    DECLARE v_first_name VARCHAR(100) DEFAULT NULL;
    DECLARE v_last_name VARCHAR(100) DEFAULT NULL;
    DECLARE v_email VARCHAR(255) DEFAULT NULL;
    DECLARE v_branch_id INT DEFAULT NULL;
    DECLARE v_stored_password VARCHAR(255) DEFAULT NULL;
    DECLARE v_status VARCHAR(50) DEFAULT NULL;
    
    IF p_role = 'inspector' THEN
        SELECT 
            i.inspector_id,
            i.first_name,
            i.last_name,
            i.email,
            i.password,
            i.status,
            ia.branch_id
        INTO 
            v_user_id,
            v_first_name,
            v_last_name,
            v_email,
            v_stored_password,
            v_status,
            v_branch_id
        FROM inspector i
        LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
        WHERE i.email = p_username
        LIMIT 1;
        
    ELSEIF p_role = 'collector' THEN
        SELECT 
            c.collector_id,
            c.first_name,
            c.last_name,
            c.email,
            c.password,
            c.status,
            ca.branch_id
        INTO 
            v_user_id,
            v_first_name,
            v_last_name,
            v_email,
            v_stored_password,
            v_status,
            v_branch_id
        FROM collector c
        LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
        WHERE c.email = p_username
        LIMIT 1;
    END IF;
    
    -- Check if user exists
    IF v_user_id IS NULL THEN
        SELECT 'User not found' AS error, NULL AS user_id;
    -- Check if password matches
    ELSEIF v_stored_password != SHA2(p_password, 256) THEN
        SELECT 'Invalid password' AS error, NULL AS user_id;
    -- Check if user is active
    ELSEIF v_status != 'active' THEN
        SELECT 'Account is not active' AS error, NULL AS user_id;
    ELSE
        -- Update last login
        IF p_role = 'inspector' THEN
            UPDATE inspector SET last_login = NOW() WHERE inspector_id = v_user_id;
        ELSE
            UPDATE collector SET last_login = NOW() WHERE collector_id = v_user_id;
        END IF;
        
        -- Return user data
        SELECT 
            NULL AS error,
            v_user_id AS user_id,
            v_first_name AS first_name,
            v_last_name AS last_name,
            v_email AS email,
            v_branch_id AS branch_id,
            p_role AS role;
    END IF;
END$$

DELIMITER ;

-- ========================================
-- STEP 6: Restore getBusinessEmployeeById procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS getBusinessEmployeeById;

DELIMITER $$

CREATE PROCEDURE `getBusinessEmployeeById`(
    IN p_employee_id INT
)
BEGIN
    SELECT 
        be.employee_id,
        be.first_name,
        be.last_name,
        be.email,
        be.contact_no,
        be.role,
        be.status,
        be.date_hired,
        be.last_login,
        be.branch_id,
        b.branch_name
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE be.employee_id = p_employee_id;
END$$

DELIMITER ;

-- ========================================
-- STEP 7: Restore createBusinessEmployee procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS createBusinessEmployee;

DELIMITER $$

CREATE PROCEDURE `createBusinessEmployee`(
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20),
    IN p_password VARCHAR(255),
    IN p_role VARCHAR(50),
    IN p_branch_id INT,
    IN p_date_hired DATE
)
BEGIN
    DECLARE v_employee_id INT;
    
    INSERT INTO business_employee (
        first_name, 
        last_name, 
        email, 
        contact_no, 
        password, 
        role, 
        branch_id, 
        date_hired, 
        status
    )
    VALUES (
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        SHA2(p_password, 256),
        p_role,
        p_branch_id,
        IFNULL(p_date_hired, CURRENT_DATE),
        'active'
    );
    
    SET v_employee_id = LAST_INSERT_ID();
    
    SELECT v_employee_id AS employee_id, 
           CONCAT('Employee ', p_first_name, ' ', p_last_name, ' created successfully') AS message;
END$$

DELIMITER ;

-- ========================================
-- STEP 8: Restore getAllBusinessEmployees procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS getAllBusinessEmployees;

DELIMITER $$

CREATE PROCEDURE `getAllBusinessEmployees`(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        be.employee_id,
        be.first_name,
        be.last_name,
        be.email,
        be.contact_no,
        be.role,
        be.status,
        be.date_hired,
        be.last_login,
        be.branch_id,
        b.branch_name
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR be.branch_id = p_branch_id)
    ORDER BY be.last_name, be.first_name;
END$$

DELIMITER ;

-- ========================================
-- STEP 9: Restore getAllActiveInspectors procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS getAllActiveInspectors;

DELIMITER $$

CREATE PROCEDURE `getAllActiveInspectors`(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        i.inspector_id,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.status,
        i.date_hired,
        i.last_login,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.status = 'active'
    AND (p_branch_id IS NULL OR ia.branch_id = p_branch_id)
    ORDER BY i.last_name, i.first_name;
END$$

DELIMITER ;

-- ========================================
-- STEP 10: Restore getAllCollectors procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS sp_getAllCollectors;

DELIMITER $$

CREATE PROCEDURE `sp_getAllCollectors`(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.status,
        c.date_hired,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (p_branch_id IS NULL OR ca.branch_id = p_branch_id)
    ORDER BY c.last_name, c.first_name;
END$$

DELIMITER ;

-- ========================================
-- STEP 11: Update updateInspector procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS updateInspector;

DELIMITER $$

CREATE PROCEDURE `updateInspector`(
    IN p_inspector_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20)
)
BEGIN
    UPDATE inspector 
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        email = COALESCE(p_email, email),
        contact_no = COALESCE(p_contact_no, contact_no)
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() AS affected_rows, 'Inspector updated successfully' AS message;
END$$

DELIMITER ;

-- ========================================
-- STEP 12: Update updateCollector procedure (without encryption)
-- ========================================

DROP PROCEDURE IF EXISTS updateCollector;

DELIMITER $$

CREATE PROCEDURE `updateCollector`(
    IN p_collector_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20)
)
BEGIN
    UPDATE collector 
    SET 
        first_name = COALESCE(p_first_name, first_name),
        last_name = COALESCE(p_last_name, last_name),
        email = COALESCE(p_email, email),
        contact_no = COALESCE(p_contact_no, contact_no)
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() AS affected_rows, 'Collector updated successfully' AS message;
END$$

DELIMITER ;

-- ========================================
-- VERIFICATION
-- ========================================

SELECT 'Database restore script completed!' AS status;
SELECT 'Please verify the stored procedures are working correctly.' AS next_step;
SELECT 'If data is corrupted, you may need to re-insert clean data manually.' AS warning;
