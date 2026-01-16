-- ========================================
-- FIX STORED PROCEDURES FOR EMAIL-BASED LOGIN
-- ========================================
-- This script updates stored procedures to work with the new
-- email-based login schema (no more username columns)
-- Run this after database reset
-- ========================================

DELIMITER $$

-- ========================================
-- INSPECTOR PROCEDURES (EMAIL-BASED)
-- ========================================

-- Get Inspectors By Branch (FIXED - no inspector_username column)
DROP PROCEDURE IF EXISTS getInspectorsByBranch$$
CREATE PROCEDURE getInspectorsByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        i.inspector_id,
        i.email,
        i.first_name,
        i.last_name,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    INNER JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id
    INNER JOIN branch b ON ia.branch_id = b.branch_id
    WHERE ia.branch_id = p_branch_id 
      AND ia.status = 'Active' 
      AND i.status = 'active'
    ORDER BY i.inspector_id DESC;
END$$

-- Get All Inspectors (FIXED)
DROP PROCEDURE IF EXISTS getAllInspectors$$
CREATE PROCEDURE getAllInspectors()
BEGIN
    SELECT 
        i.inspector_id,
        i.email,
        i.first_name,
        i.last_name,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.status = 'active'
    ORDER BY i.inspector_id DESC;
END$$

-- Get Inspector By Email (replaces getInspectorByUsername)
DROP PROCEDURE IF EXISTS getInspectorByEmail$$
CREATE PROCEDURE getInspectorByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        i.inspector_id,
        i.email,
        i.password,
        i.first_name,
        i.last_name,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.email = p_email AND i.status = 'active';
END$$

-- Create Inspector (EMAIL-BASED)
DROP PROCEDURE IF EXISTS createInspector$$
CREATE PROCEDURE createInspector(
    IN p_password VARCHAR(500),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500),
    IN p_branch_id INT
)
BEGIN
    DECLARE new_inspector_id INT;
    
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
    
    SET new_inspector_id = LAST_INSERT_ID();
    
    -- Create assignment if branch_id provided
    IF p_branch_id IS NOT NULL THEN
        INSERT INTO inspector_assignment (inspector_id, branch_id, assigned_date, status)
        VALUES (new_inspector_id, p_branch_id, CURDATE(), 'Active');
    END IF;
    
    SELECT new_inspector_id AS inspector_id;
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

-- Delete Inspector
DROP PROCEDURE IF EXISTS deleteInspector$$
CREATE PROCEDURE deleteInspector(IN p_inspector_id INT)
BEGIN
    -- Remove assignments first
    DELETE FROM inspector_assignment WHERE inspector_id = p_inspector_id;
    -- Delete inspector
    DELETE FROM inspector WHERE inspector_id = p_inspector_id;
    
    SELECT p_inspector_id AS inspector_id, 'Inspector deleted successfully' AS message;
END$$

-- ========================================
-- COLLECTOR PROCEDURES (EMAIL-BASED)
-- ========================================

-- Get Collectors By Branch (FIXED - no collector_username column)
DROP PROCEDURE IF EXISTS getCollectorsByBranch$$
CREATE PROCEDURE getCollectorsByBranch(IN p_branch_id INT)
BEGIN
    SELECT 
        c.collector_id,
        c.email,
        c.first_name,
        c.last_name,
        c.contact_no,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    INNER JOIN collector_assignment ca ON c.collector_id = ca.collector_id
    INNER JOIN branch b ON ca.branch_id = b.branch_id
    WHERE ca.branch_id = p_branch_id 
      AND ca.status = 'Active' 
      AND c.status = 'active'
    ORDER BY c.collector_id DESC;
END$$

-- Get All Collectors (FIXED)
DROP PROCEDURE IF EXISTS getAllCollectors$$
CREATE PROCEDURE getAllCollectors()
BEGIN
    SELECT 
        c.collector_id,
        c.email,
        c.first_name,
        c.last_name,
        c.contact_no,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.status = 'active'
    ORDER BY c.collector_id DESC;
END$$

-- Get Collector By Email (replaces getCollectorByUsername)
DROP PROCEDURE IF EXISTS getCollectorByEmail$$
CREATE PROCEDURE getCollectorByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        c.collector_id,
        c.email,
        c.password,
        c.first_name,
        c.last_name,
        c.contact_no,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.email = p_email AND c.status = 'active';
END$$

-- Create Collector (EMAIL-BASED)
DROP PROCEDURE IF EXISTS createCollector$$
CREATE PROCEDURE createCollector(
    IN p_password VARCHAR(500),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500),
    IN p_branch_id INT
)
BEGIN
    DECLARE new_collector_id INT;
    
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
    
    SET new_collector_id = LAST_INSERT_ID();
    
    -- Create assignment if branch_id provided
    IF p_branch_id IS NOT NULL THEN
        INSERT INTO collector_assignment (collector_id, branch_id, assigned_date, status)
        VALUES (new_collector_id, p_branch_id, CURDATE(), 'Active');
    END IF;
    
    SELECT new_collector_id AS collector_id;
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

-- Delete Collector
DROP PROCEDURE IF EXISTS deleteCollector$$
CREATE PROCEDURE deleteCollector(IN p_collector_id INT)
BEGIN
    -- Remove assignments first
    DELETE FROM collector_assignment WHERE collector_id = p_collector_id;
    -- Delete collector
    DELETE FROM collector WHERE collector_id = p_collector_id;
    
    SELECT p_collector_id AS collector_id, 'Collector deleted successfully' AS message;
END$$

-- ========================================
-- BUSINESS EMPLOYEE PROCEDURES (EMAIL-BASED)
-- ========================================

-- Create Business Employee (FIXED - 8 parameters, email login)
DROP PROCEDURE IF EXISTS createBusinessEmployee$$
CREATE PROCEDURE createBusinessEmployee(
    IN p_password VARCHAR(500),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_phone_number VARCHAR(500),
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

-- Get All Business Employees
DROP PROCEDURE IF EXISTS getAllBusinessEmployees$$
CREATE PROCEDURE getAllBusinessEmployees(IN p_branch_id INT)
BEGIN
    SELECT 
        be.business_employee_id,
        be.email,
        be.first_name,
        be.last_name,
        be.phone_number,
        be.status,
        be.permissions,
        be.branch_id,
        be.business_manager_id,
        be.last_login,
        be.created_at,
        be.updated_at,
        b.branch_name
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE be.branch_id = p_branch_id
    ORDER BY be.created_at DESC;
END$$

-- Get Business Employee By Email (for login)
DROP PROCEDURE IF EXISTS getBusinessEmployeeByEmail$$
CREATE PROCEDURE getBusinessEmployeeByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        be.business_employee_id,
        be.email,
        be.employee_password,
        be.first_name,
        be.last_name,
        be.phone_number,
        be.status,
        be.permissions,
        be.branch_id,
        be.business_manager_id,
        be.last_login,
        b.branch_name
    FROM business_employee be
    LEFT JOIN branch b ON be.branch_id = b.branch_id
    WHERE be.email = p_email;
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

-- Delete Business Employee
DROP PROCEDURE IF EXISTS deleteBusinessEmployee$$
CREATE PROCEDURE deleteBusinessEmployee(IN p_employee_id INT)
BEGIN
    DELETE FROM business_employee WHERE business_employee_id = p_employee_id;
    
    SELECT p_employee_id AS business_employee_id, 'Employee deleted successfully' AS message;
END$$

-- Update Last Login
DROP PROCEDURE IF EXISTS updateEmployeeLastLogin$$
CREATE PROCEDURE updateEmployeeLastLogin(IN p_employee_id INT)
BEGIN
    UPDATE business_employee
    SET last_login = NOW()
    WHERE business_employee_id = p_employee_id;
END$$

-- Update Inspector Last Login
DROP PROCEDURE IF EXISTS updateInspectorLastLogin$$
CREATE PROCEDURE updateInspectorLastLogin(IN p_inspector_id INT)
BEGIN
    UPDATE inspector
    SET last_login = NOW()
    WHERE inspector_id = p_inspector_id;
END$$

-- Update Collector Last Login
DROP PROCEDURE IF EXISTS updateCollectorLastLogin$$
CREATE PROCEDURE updateCollectorLastLogin(IN p_collector_id INT)
BEGIN
    UPDATE collector
    SET last_login = NOW()
    WHERE collector_id = p_collector_id;
END$$

DELIMITER ;

-- ========================================
-- VERIFY PROCEDURES CREATED
-- ========================================
SELECT 'Stored procedures updated for email-based login!' AS status;

SELECT ROUTINE_NAME, ROUTINE_TYPE 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE() 
AND ROUTINE_NAME IN (
    'getInspectorsByBranch',
    'getAllInspectors',
    'getCollectorsByBranch',
    'getAllCollectors',
    'createBusinessEmployee',
    'getAllBusinessEmployees',
    'createInspector',
    'createCollector'
)
ORDER BY ROUTINE_NAME;
