-- ========================================
-- CREATE USER PROCEDURES (EMAIL LOGIN)
-- ========================================
-- All user creation procedures now:
-- 1. Use EMAIL as login (no username)
-- 2. Store ENCRYPTED passwords (not hashed)
-- 3. Store ENCRYPTED personal info
-- ========================================

USE naga_stall;

DELIMITER $$

-- ========================================
-- CREATE BUSINESS EMPLOYEE
-- ========================================
DROP PROCEDURE IF EXISTS createBusinessEmployee$$
CREATE PROCEDURE createBusinessEmployee(
    IN p_password VARCHAR(500),         -- Encrypted password
    IN p_first_name VARCHAR(500),       -- Encrypted
    IN p_last_name VARCHAR(500),        -- Encrypted
    IN p_email VARCHAR(500),            -- Encrypted - used for login
    IN p_phone_number VARCHAR(500),     -- Encrypted
    IN p_branch_id INT,
    IN p_created_by INT,
    IN p_permissions JSON
)
BEGIN
    INSERT INTO business_employee (
        employee_password,
        first_name,
        last_name,
        email,
        phone_number,
        branch_id,
        business_manager_id,
        permissions,
        status
    ) VALUES (
        p_password,
        p_first_name,
        p_last_name,
        p_email,
        p_phone_number,
        p_branch_id,
        p_created_by,
        p_permissions,
        'Active'
    );
    
    SELECT LAST_INSERT_ID() AS business_employee_id;
END$$

-- ========================================
-- CREATE INSPECTOR
-- ========================================
DROP PROCEDURE IF EXISTS createInspector$$
CREATE PROCEDURE createInspector(
    IN p_password VARCHAR(500),         -- Encrypted password
    IN p_first_name VARCHAR(500),       -- Encrypted
    IN p_last_name VARCHAR(500),        -- Encrypted
    IN p_email VARCHAR(500),            -- Encrypted - used for login
    IN p_contact_no VARCHAR(500)        -- Encrypted
)
BEGIN
    INSERT INTO inspector (
        password,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_password,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        CURDATE(),
        'active'
    );
    
    SELECT LAST_INSERT_ID() AS inspector_id;
END$$

-- ========================================
-- CREATE COLLECTOR
-- ========================================
DROP PROCEDURE IF EXISTS createCollector$$
CREATE PROCEDURE createCollector(
    IN p_password VARCHAR(500),         -- Encrypted password
    IN p_first_name VARCHAR(500),       -- Encrypted
    IN p_last_name VARCHAR(500),        -- Encrypted
    IN p_email VARCHAR(500),            -- Encrypted - used for login
    IN p_contact_no VARCHAR(500)        -- Encrypted
)
BEGIN
    INSERT INTO collector (
        password,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_password,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        CURDATE(),
        'active'
    );
    
    SELECT LAST_INSERT_ID() AS collector_id;
END$$

-- ========================================
-- CREATE BUSINESS MANAGER
-- ========================================
DROP PROCEDURE IF EXISTS createBusinessManager$$
CREATE PROCEDURE createBusinessManager(
    IN p_password VARCHAR(500),         -- Encrypted password
    IN p_first_name VARCHAR(500),       -- Encrypted
    IN p_last_name VARCHAR(500),        -- Encrypted
    IN p_email VARCHAR(500),            -- Encrypted - used for login
    IN p_contact_number VARCHAR(500),   -- Encrypted
    IN p_business_owner_id INT,
    IN p_branch_id INT
)
BEGIN
    INSERT INTO business_manager (
        manager_password,
        first_name,
        last_name,
        email,
        contact_number,
        business_owner_id,
        branch_id,
        status
    ) VALUES (
        p_password,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_number,
        p_business_owner_id,
        p_branch_id,
        'Active'
    );
    
    SELECT LAST_INSERT_ID() AS business_manager_id;
END$$

-- ========================================
-- CREATE BUSINESS OWNER
-- ========================================
DROP PROCEDURE IF EXISTS createBusinessOwner$$
CREATE PROCEDURE createBusinessOwner(
    IN p_password VARCHAR(500),         -- Encrypted password
    IN p_full_name VARCHAR(500),        -- Encrypted
    IN p_first_name VARCHAR(500),       -- Encrypted
    IN p_last_name VARCHAR(500),        -- Encrypted
    IN p_email VARCHAR(500),            -- Encrypted - used for login
    IN p_contact_number VARCHAR(500),   -- Encrypted
    IN p_created_by_admin INT
)
BEGIN
    INSERT INTO stall_business_owner (
        owner_password,
        owner_full_name,
        first_name,
        last_name,
        email,
        contact_number,
        created_by_system_admin,
        status,
        subscription_status
    ) VALUES (
        p_password,
        p_full_name,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_number,
        p_created_by_admin,
        'Active',
        'Active'
    );
    
    SELECT LAST_INSERT_ID() AS business_owner_id;
END$$

-- ========================================
-- GET BUSINESS EMPLOYEE BY ID (for login post-auth)
-- ========================================
DROP PROCEDURE IF EXISTS getBusinessEmployeeById$$
CREATE PROCEDURE getBusinessEmployeeById(IN p_employee_id INT)
BEGIN
    SELECT 
        business_employee_id,
        email,
        employee_password,
        first_name,
        last_name,
        phone_number,
        status,
        business_manager_id,
        branch_id,
        permissions
    FROM business_employee
    WHERE business_employee_id = p_employee_id;
END$$

-- ========================================
-- GET ALL BUSINESS EMPLOYEES
-- ========================================
DROP PROCEDURE IF EXISTS getAllBusinessEmployees$$
CREATE PROCEDURE getAllBusinessEmployees(IN p_status VARCHAR(20))
BEGIN
    SELECT 
        business_employee_id,
        email,
        first_name,
        last_name,
        phone_number,
        status,
        business_manager_id,
        branch_id,
        permissions,
        last_login,
        created_at
    FROM business_employee
    WHERE status = p_status OR p_status IS NULL;
END$$

DELIMITER ;

SELECT '✅ User creation procedures updated for email login!' AS status;
SELECT 'All procedures now use email as login (no username)' AS info;
SELECT 'Passwords are encrypted with AES-256-GCM' AS note;
