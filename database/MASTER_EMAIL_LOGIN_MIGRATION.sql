-- ========================================
-- MASTER EMAIL LOGIN MIGRATION SCRIPT
-- ========================================
-- Run this script in MySQL Workbench to:
-- 1. Update table schemas for email login
-- 2. Create login procedures
-- 3. Create user management procedures
-- 
-- AFTER running this SQL:
-- Run: node database/seed-encrypted-admin.js
-- ========================================

USE naga_stall;

-- ========================================
-- FIX DATABASE COLLATION
-- ========================================
ALTER DATABASE naga_stall CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ========================================
-- DISABLE FOREIGN KEY CHECKS
-- ========================================
SET FOREIGN_KEY_CHECKS = 0;

-- ========================================
-- DROP DEPENDENT VIEWS FIRST
-- ========================================
DROP VIEW IF EXISTS view_active_collectors;
DROP VIEW IF EXISTS view_active_inspectors;
DROP VIEW IF EXISTS view_all_staff;
DROP VIEW IF EXISTS view_business_employees;
DROP VIEW IF EXISTS view_business_managers;

-- ========================================
-- STEP 1: UPDATE TABLE SCHEMAS
-- ========================================

-- System Administrator (now with encrypted data)
DROP TABLE IF EXISTS system_administrator;
CREATE TABLE system_administrator (
  system_admin_id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(500) NOT NULL, -- ENCRYPTED - used for login
  admin_password VARCHAR(500) NOT NULL, -- ENCRYPTED with AES-256-GCM
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  status ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (system_admin_id),
  KEY idx_email (email(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business Owner (use email for login)
DROP TABLE IF EXISTS stall_business_owner;
CREATE TABLE stall_business_owner (
  business_owner_id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(500) NOT NULL, -- ENCRYPTED - used for login
  owner_password VARCHAR(500) NOT NULL, -- ENCRYPTED with AES-256-GCM
  owner_full_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  status ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  subscription_status ENUM('Active','Pending','Expired','Cancelled') DEFAULT 'Pending',
  primary_manager_id INT(11) DEFAULT NULL,
  created_by_system_admin INT(11) DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (business_owner_id),
  KEY idx_email (email(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business Manager (use email for login)
DROP TABLE IF EXISTS business_manager;
CREATE TABLE business_manager (
  business_manager_id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(500) NOT NULL, -- ENCRYPTED - used for login
  manager_password VARCHAR(500) NOT NULL, -- ENCRYPTED with AES-256-GCM
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  address TEXT, -- ENCRYPTED
  status ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  business_owner_id INT(11) DEFAULT NULL,
  branch_id INT(11) DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (business_manager_id),
  KEY idx_email (email(255)),
  KEY fk_manager_owner (business_owner_id),
  KEY fk_manager_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Business Employee (use email for login)
DROP TABLE IF EXISTS business_employee;
CREATE TABLE business_employee (
  business_employee_id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(500) NOT NULL, -- ENCRYPTED - used for login
  employee_password VARCHAR(500) NOT NULL, -- ENCRYPTED with AES-256-GCM
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  phone_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  address TEXT, -- ENCRYPTED
  status ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  business_manager_id INT(11) DEFAULT NULL,
  branch_id INT(11) DEFAULT NULL,
  permissions JSON DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (business_employee_id),
  KEY idx_email (email(255)),
  KEY fk_employee_manager (business_manager_id),
  KEY fk_employee_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inspector (use email for login)
DROP TABLE IF EXISTS inspector;
CREATE TABLE inspector (
  inspector_id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(500) NOT NULL, -- ENCRYPTED - used for login
  password VARCHAR(500) NOT NULL, -- ENCRYPTED with AES-256-GCM
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  contact_no VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  date_hired DATE DEFAULT NULL,
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (inspector_id),
  KEY idx_email (email(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Collector (use email for login)
DROP TABLE IF EXISTS collector;
CREATE TABLE collector (
  collector_id INT(11) NOT NULL AUTO_INCREMENT,
  email VARCHAR(500) NOT NULL, -- ENCRYPTED - used for login
  password VARCHAR(500) NOT NULL, -- ENCRYPTED with AES-256-GCM
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  contact_no VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  date_hired DATE DEFAULT NULL,
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (collector_id),
  KEY idx_email (email(255))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stallholder (use email for login in mobile)
DROP TABLE IF EXISTS stallholder;
CREATE TABLE stallholder (
  stallholder_id INT(11) NOT NULL AUTO_INCREMENT,
  mobile_user_id INT(11) DEFAULT NULL,
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  email VARCHAR(500) DEFAULT NULL, -- ENCRYPTED - used for login
  contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  address TEXT, -- ENCRYPTED
  stall_id INT(11) DEFAULT NULL,
  branch_id INT(11) DEFAULT NULL,
  payment_status ENUM('paid','unpaid','overdue') DEFAULT 'unpaid',
  status ENUM('active','inactive','suspended','terminated') DEFAULT 'active',
  move_in_date DATE DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stallholder_id),
  KEY idx_email (email(255)),
  KEY fk_stallholder_mobile_user (mobile_user_id),
  KEY fk_stallholder_stall (stall_id),
  KEY fk_stallholder_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- ========================================
SET FOREIGN_KEY_CHECKS = 1;

SELECT '✅ Step 1 Complete: Tables updated for email login' AS status;

-- ========================================
-- STEP 2: CREATE LOGIN PROCEDURES
-- ========================================

DELIMITER $$

-- Get System Administrator by Email
DROP PROCEDURE IF EXISTS getSystemAdminByEmail$$
CREATE PROCEDURE getSystemAdminByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        system_admin_id,
        email,
        admin_password,
        first_name,
        last_name,
        status
    FROM system_administrator
    WHERE email = p_email
      AND status = 'Active';
END$$

-- Get Business Owner by Email
DROP PROCEDURE IF EXISTS getBusinessOwnerByEmail$$
CREATE PROCEDURE getBusinessOwnerByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        business_owner_id,
        email,
        owner_password,
        owner_full_name,
        first_name,
        last_name,
        contact_number,
        status,
        subscription_status,
        primary_manager_id
    FROM stall_business_owner
    WHERE email = p_email
      AND status = 'Active';
END$$

-- Get Business Manager by Email
DROP PROCEDURE IF EXISTS getBusinessManagerByEmail$$
CREATE PROCEDURE getBusinessManagerByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        business_manager_id,
        email,
        manager_password,
        first_name,
        last_name,
        contact_number,
        status,
        business_owner_id,
        branch_id
    FROM business_manager
    WHERE email = p_email
      AND status = 'Active';
END$$

-- Get Business Employee by Email
DROP PROCEDURE IF EXISTS getBusinessEmployeeByEmail$$
CREATE PROCEDURE getBusinessEmployeeByEmail(IN p_email VARCHAR(500))
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
    WHERE email = p_email
      AND status = 'Active';
END$$

-- Get Inspector by Email
DROP PROCEDURE IF EXISTS getInspectorByEmail$$
CREATE PROCEDURE getInspectorByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        inspector_id,
        email,
        password,
        first_name,
        last_name,
        contact_no,
        date_hired,
        status
    FROM inspector
    WHERE email = p_email
      AND status = 'active';
END$$

-- Get Collector by Email
DROP PROCEDURE IF EXISTS getCollectorByEmail$$
CREATE PROCEDURE getCollectorByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        collector_id,
        email,
        password,
        first_name,
        last_name,
        contact_no,
        date_hired,
        status
    FROM collector
    WHERE email = p_email
      AND status = 'active';
END$$

-- Get Stallholder by Email (for mobile login)
DROP PROCEDURE IF EXISTS getStallholderByEmail$$
CREATE PROCEDURE getStallholderByEmail(IN p_email VARCHAR(500))
BEGIN
    SELECT 
        s.stallholder_id,
        s.mobile_user_id,
        s.email,
        s.first_name,
        s.last_name,
        s.contact_number,
        s.address,
        s.stall_id,
        s.branch_id,
        s.payment_status,
        s.status,
        m.password as stallholder_password
    FROM stallholder s
    LEFT JOIN mobile_user m ON s.mobile_user_id = m.mobile_user_id
    WHERE s.email = p_email
      AND s.status = 'active';
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

SELECT '✅ Step 2 Complete: Login procedures created' AS status$$

-- ========================================
-- STEP 3: CREATE USER MANAGEMENT PROCEDURES
-- ========================================

-- Create Business Employee
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

-- Create Inspector
DROP PROCEDURE IF EXISTS createInspector$$
CREATE PROCEDURE createInspector(
    IN p_password VARCHAR(500),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500)
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

-- Create Collector
DROP PROCEDURE IF EXISTS createCollector$$
CREATE PROCEDURE createCollector(
    IN p_password VARCHAR(500),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_no VARCHAR(500)
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

-- Create Business Manager
DROP PROCEDURE IF EXISTS createBusinessManager$$
CREATE PROCEDURE createBusinessManager(
    IN p_password VARCHAR(500),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_number VARCHAR(500),
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

-- Create Business Owner
DROP PROCEDURE IF EXISTS createBusinessOwner$$
CREATE PROCEDURE createBusinessOwner(
    IN p_password VARCHAR(500),
    IN p_full_name VARCHAR(500),
    IN p_first_name VARCHAR(500),
    IN p_last_name VARCHAR(500),
    IN p_email VARCHAR(500),
    IN p_contact_number VARCHAR(500),
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

-- Get Business Employee by ID (for login post-auth)
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

-- Get All Business Employees
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

SELECT '✅ Step 3 Complete: User management procedures created' AS status;

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
SELECT '========================================' AS divider;
SELECT '✅ EMAIL LOGIN MIGRATION COMPLETE!' AS status;
SELECT '========================================' AS divider;
SELECT 'Next Step: Run the admin seed script' AS next_step;
SELECT 'Command: node database/seed-encrypted-admin.js' AS command;
SELECT 'IMPORTANT: Save the generated password!' AS warning;
