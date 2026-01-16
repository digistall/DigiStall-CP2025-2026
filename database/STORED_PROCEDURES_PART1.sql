-- ========================================
-- NAGA STALL - STORED PROCEDURES (PART 1)
-- ========================================
-- User Creation Procedures
-- Data is encrypted in Node.js before being passed to these procedures
-- ========================================

USE naga_stall;

DELIMITER $$

-- ========================================
-- INSPECTOR PROCEDURES
-- ========================================

-- Create Inspector (data already encrypted from Node.js)
DROP PROCEDURE IF EXISTS createInspector$$
CREATE PROCEDURE createInspector(
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500),
    IN p_password_hash VARCHAR(255),
    IN p_branch_id INT,
    IN p_date_hired DATE,
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE new_inspector_id INT;
    DECLARE v_username VARCHAR(50);
    
    -- Generate username from first 3 chars of first name + last 4 digits of timestamp
    SET v_username = CONCAT(
        LOWER(LEFT(REPLACE(p_first_name, ':', ''), 3)),
        '_ins',
        RIGHT(UNIX_TIMESTAMP(), 4)
    );
    
    INSERT INTO inspector (
        inspector_username, first_name, last_name, email, contact_no, 
        password, date_hired, status
    ) VALUES (
        v_username, p_first_name, p_last_name, p_email, p_contact_no,
        p_password_hash, IFNULL(p_date_hired, CURRENT_DATE), 'active'
    );
    
    SET new_inspector_id = LAST_INSERT_ID();
    
    -- Create assignment
    INSERT INTO inspector_assignment (inspector_id, branch_id, start_date, status, remarks)
    VALUES (new_inspector_id, p_branch_id, CURRENT_DATE, 'Active', 'Newly hired inspector');
    
    -- Log action
    INSERT INTO inspector_action_log (inspector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (new_inspector_id, p_branch_id, p_branch_manager_id, 'New Hire', NOW(), 'Inspector created');
    
    SELECT new_inspector_id AS inspector_id, v_username AS username, 'Inspector created successfully' AS message;
END$$

-- Get All Inspectors (returns encrypted data, decrypt in Node.js)
DROP PROCEDURE IF EXISTS getAllInspectors$$
CREATE PROCEDURE getAllInspectors()
BEGIN
    SELECT 
        i.inspector_id,
        i.inspector_username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    ORDER BY i.inspector_id DESC;
END$$

-- Get Inspector By ID
DROP PROCEDURE IF EXISTS getInspectorById$$
CREATE PROCEDURE getInspectorById(IN p_inspector_id INT)
BEGIN
    SELECT 
        i.inspector_id,
        i.inspector_username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.inspector_id = p_inspector_id;
END$$

-- Get Inspector By Username (for login)
DROP PROCEDURE IF EXISTS getInspectorByUsername$$
CREATE PROCEDURE getInspectorByUsername(IN p_username VARCHAR(50))
BEGIN
    SELECT 
        i.inspector_id,
        i.inspector_username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.password,
        i.status,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.inspector_username = p_username AND i.status = 'active';
END$$

-- Get Inspectors By Branch
DROP PROCEDURE IF EXISTS getInspectorsByBranch$$
CREATE PROCEDURE getInspectorsByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        i.inspector_id,
        i.inspector_username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login
    FROM inspector i
    INNER JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id
    WHERE ia.branch_id = p_branch_id AND ia.status = 'Active' AND i.status = 'active'
    ORDER BY i.inspector_id DESC;
END$$

-- Update Inspector
DROP PROCEDURE IF EXISTS updateInspector$$
CREATE PROCEDURE updateInspector(
    IN p_inspector_id INT,
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500)
)
BEGIN
    UPDATE inspector
    SET first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        contact_no = p_contact_no,
        updated_at = NOW()
    WHERE inspector_id = p_inspector_id;
    
    SELECT p_inspector_id AS inspector_id, 'Inspector updated successfully' AS message;
END$$

-- ========================================
-- COLLECTOR PROCEDURES
-- ========================================

-- Create Collector
DROP PROCEDURE IF EXISTS createCollector$$
CREATE PROCEDURE createCollector(
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500),
    IN p_password_hash VARCHAR(255),
    IN p_branch_id INT,
    IN p_date_hired DATE,
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE new_collector_id INT;
    DECLARE v_username VARCHAR(50);
    
    SET v_username = CONCAT(
        LOWER(LEFT(REPLACE(p_first_name, ':', ''), 3)),
        '_col',
        RIGHT(UNIX_TIMESTAMP(), 4)
    );
    
    INSERT INTO collector (
        collector_username, first_name, last_name, email, contact_no,
        password, date_hired, status
    ) VALUES (
        v_username, p_first_name, p_last_name, p_email, p_contact_no,
        p_password_hash, IFNULL(p_date_hired, CURRENT_DATE), 'active'
    );
    
    SET new_collector_id = LAST_INSERT_ID();
    
    -- Create assignment
    INSERT INTO collector_assignment (collector_id, branch_id, start_date, status, remarks)
    VALUES (new_collector_id, p_branch_id, CURRENT_DATE, 'Active', 'Newly hired collector');
    
    -- Log action
    INSERT INTO collector_action_log (collector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (new_collector_id, p_branch_id, p_branch_manager_id, 'New Hire', NOW(), 'Collector created');
    
    SELECT new_collector_id AS collector_id, v_username AS username, 'Collector created successfully' AS message;
END$$

-- Get All Collectors
DROP PROCEDURE IF EXISTS getAllCollectors$$
CREATE PROCEDURE getAllCollectors()
BEGIN
    SELECT 
        c.collector_id,
        c.collector_username,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    ORDER BY c.collector_id DESC;
END$$

-- Get Collector By ID
DROP PROCEDURE IF EXISTS getCollectorById$$
CREATE PROCEDURE getCollectorById(IN p_collector_id INT)
BEGIN
    SELECT 
        c.collector_id,
        c.collector_username,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.collector_id = p_collector_id;
END$$

-- Get Collector By Username (for login)
DROP PROCEDURE IF EXISTS getCollectorByUsername$$
CREATE PROCEDURE getCollectorByUsername(IN p_username VARCHAR(50))
BEGIN
    SELECT 
        c.collector_id,
        c.collector_username,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.password,
        c.status,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.collector_username = p_username AND c.status = 'active';
END$$

-- Get Collectors By Branch
DROP PROCEDURE IF EXISTS getCollectorsByBranch$$
CREATE PROCEDURE getCollectorsByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        c.collector_id,
        c.collector_username,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.last_login
    FROM collector c
    INNER JOIN collector_assignment ca ON c.collector_id = ca.collector_id
    WHERE ca.branch_id = p_branch_id AND ca.status = 'Active' AND c.status = 'active'
    ORDER BY c.collector_id DESC;
END$$

-- Update Collector
DROP PROCEDURE IF EXISTS updateCollector$$
CREATE PROCEDURE updateCollector(
    IN p_collector_id INT,
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500)
)
BEGIN
    UPDATE collector
    SET first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        contact_no = p_contact_no,
        updated_at = NOW()
    WHERE collector_id = p_collector_id;
    
    SELECT p_collector_id AS collector_id, 'Collector updated successfully' AS message;
END$$

-- ========================================
-- BUSINESS EMPLOYEE PROCEDURES
-- ========================================

-- Create Business Employee
DROP PROCEDURE IF EXISTS createBusinessEmployee$$
CREATE PROCEDURE createBusinessEmployee(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_phone_number VARCHAR(500),
    IN p_branch_id INT,
    IN p_created_by_manager INT,
    IN p_permissions JSON
)
BEGIN
    DECLARE new_employee_id INT;
    
    INSERT INTO business_employee (
        employee_username, employee_password_hash, first_name, last_name,
        email, phone_number, branch_id, created_by_manager, permissions,
        status, password_reset_required
    ) VALUES (
        p_username, p_password_hash, p_first_name, p_last_name,
        p_email, p_phone_number, p_branch_id, p_created_by_manager, p_permissions,
        'Active', 1
    );
    
    SET new_employee_id = LAST_INSERT_ID();
    
    SELECT new_employee_id AS business_employee_id, 'Employee created successfully' AS message;
END$$

-- Get All Business Employees
DROP PROCEDURE IF EXISTS getAllBusinessEmployees$$
CREATE PROCEDURE getAllBusinessEmployees()
BEGIN
    SELECT 
        be.business_employee_id,
        be.employee_username,
        be.first_name,
        be.last_name,
        be.email,
        be.phone_number,
        be.branch_id,
        b.branch_name,
        be.permissions,
        be.status,
        be.last_login,
        be.created_at
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    ORDER BY be.business_employee_id DESC;
END$$

-- Get Business Employee By Username (for login)
DROP PROCEDURE IF EXISTS getBusinessEmployeeByUsername$$
CREATE PROCEDURE getBusinessEmployeeByUsername(IN p_username VARCHAR(50))
BEGIN
    SELECT 
        be.business_employee_id,
        be.employee_username,
        be.employee_password_hash,
        be.first_name,
        be.last_name,
        be.email,
        be.phone_number,
        be.branch_id,
        b.branch_name,
        be.permissions,
        be.status,
        be.password_reset_required
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE be.employee_username = p_username AND be.status = 'Active';
END$$

-- Get Business Employees By Branch
DROP PROCEDURE IF EXISTS getBusinessEmployeesByBranch$$
CREATE PROCEDURE getBusinessEmployeesByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        be.business_employee_id,
        be.employee_username,
        be.first_name,
        be.last_name,
        be.email,
        be.phone_number,
        be.permissions,
        be.status,
        be.last_login,
        be.created_at
    FROM business_employee be
    WHERE be.branch_id = p_branch_id AND be.status = 'Active'
    ORDER BY be.business_employee_id DESC;
END$$

-- Update Business Employee
DROP PROCEDURE IF EXISTS updateBusinessEmployee$$
CREATE PROCEDURE updateBusinessEmployee(
    IN p_employee_id INT,
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_phone_number VARCHAR(500),
    IN p_permissions JSON
)
BEGIN
    UPDATE business_employee
    SET first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        phone_number = p_phone_number,
        permissions = IFNULL(p_permissions, permissions),
        updated_at = NOW()
    WHERE business_employee_id = p_employee_id;
    
    SELECT p_employee_id AS business_employee_id, 'Employee updated successfully' AS message;
END$$

-- ========================================
-- BUSINESS MANAGER PROCEDURES
-- ========================================

-- Create Business Manager
DROP PROCEDURE IF EXISTS createBusinessManager$$
CREATE PROCEDURE createBusinessManager(
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_number VARCHAR(500),
    IN p_address TEXT,
    IN p_created_by_owner INT
)
BEGIN
    DECLARE new_manager_id INT;
    
    INSERT INTO business_manager (
        manager_username, manager_password_hash, first_name, last_name,
        email, contact_number, address, status, created_by_owner
    ) VALUES (
        p_username, p_password_hash, p_first_name, p_last_name,
        p_email, p_contact_number, p_address, 'Active', p_created_by_owner
    );
    
    SET new_manager_id = LAST_INSERT_ID();
    
    SELECT new_manager_id AS business_manager_id, 'Manager created successfully' AS message;
END$$

-- Get All Business Managers
DROP PROCEDURE IF EXISTS getAllBusinessManagers$$
CREATE PROCEDURE getAllBusinessManagers()
BEGIN
    SELECT 
        bm.business_manager_id,
        bm.manager_username,
        bm.first_name,
        bm.last_name,
        bm.email,
        bm.contact_number,
        bm.address,
        bm.status,
        bm.last_login,
        bm.created_at
    FROM business_manager bm
    ORDER BY bm.business_manager_id DESC;
END$$

-- Get Business Manager By Username (for login)
DROP PROCEDURE IF EXISTS getBusinessManagerByUsername$$
CREATE PROCEDURE getBusinessManagerByUsername(IN p_username VARCHAR(50))
BEGIN
    SELECT 
        bm.business_manager_id,
        bm.manager_username,
        bm.manager_password_hash,
        bm.first_name,
        bm.last_name,
        bm.email,
        bm.contact_number,
        bm.status
    FROM business_manager bm
    WHERE bm.manager_username = p_username AND bm.status = 'Active';
END$$

-- Update Business Manager
DROP PROCEDURE IF EXISTS updateBusinessManager$$
CREATE PROCEDURE updateBusinessManager(
    IN p_manager_id INT,
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_number VARCHAR(500),
    IN p_address TEXT
)
BEGIN
    UPDATE business_manager
    SET first_name = p_first_name,
        last_name = p_last_name,
        email = p_email,
        contact_number = p_contact_number,
        address = IFNULL(p_address, address),
        updated_at = NOW()
    WHERE business_manager_id = p_manager_id;
    
    SELECT p_manager_id AS business_manager_id, 'Manager updated successfully' AS message;
END$$

-- ========================================
-- LOGIN PROCEDURES (for authentication)
-- All username parameters use COLLATE utf8mb4_unicode_ci to match table collation
-- ========================================

-- Get System Administrator by Username
DROP PROCEDURE IF EXISTS getSystemAdminByUsername$$
CREATE PROCEDURE getSystemAdminByUsername(IN p_username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
    SELECT 
        system_admin_id,
        admin_username,
        admin_password_hash,
        first_name,
        last_name,
        email,
        status
    FROM system_administrator
    WHERE admin_username = p_username COLLATE utf8mb4_unicode_ci 
      AND status = 'Active';
END$$

-- Get Business Owner by Username
DROP PROCEDURE IF EXISTS getBusinessOwnerByUsername$$
CREATE PROCEDURE getBusinessOwnerByUsername(IN p_username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
    SELECT 
        business_owner_id,
        owner_username,
        owner_password_hash,
        owner_full_name,
        first_name,
        last_name,
        email,
        contact_number,
        status,
        subscription_status,
        primary_manager_id
    FROM stall_business_owner
    WHERE owner_username = p_username COLLATE utf8mb4_unicode_ci 
      AND status = 'Active';
END$$

-- Get Business Manager by Username
DROP PROCEDURE IF EXISTS getBusinessManagerByUsername$$
CREATE PROCEDURE getBusinessManagerByUsername(IN p_username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
    SELECT 
        business_manager_id,
        manager_username,
        manager_password_hash,
        first_name,
        last_name,
        email,
        contact_number,
        status,
        business_owner_id,
        branch_id
    FROM business_manager
    WHERE manager_username = p_username COLLATE utf8mb4_unicode_ci 
      AND status = 'Active';
END$$

-- Get Business Employee by Username
DROP PROCEDURE IF EXISTS getBusinessEmployeeByUsername$$
CREATE PROCEDURE getBusinessEmployeeByUsername(IN p_username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci)
BEGIN
    SELECT 
        business_employee_id,
        employee_username,
        employee_password_hash,
        first_name,
        last_name,
        email,
        phone_number,
        status,
        business_manager_id,
        branch_id
    FROM business_employee
    WHERE employee_username = p_username COLLATE utf8mb4_unicode_ci 
      AND status = 'Active';
END$$

-- Get Branch by ID
DROP PROCEDURE IF EXISTS getBranchById$$
CREATE PROCEDURE getBranchById(IN p_branch_id INT)
BEGIN
    SELECT 
        branch_id,
        branch_name,
        area,
        location,
        address,
        contact_number,
        email,
        status,
        business_owner_id,
        business_manager_id
    FROM branch
    WHERE branch_id = p_branch_id;
END$$

DELIMITER ;
