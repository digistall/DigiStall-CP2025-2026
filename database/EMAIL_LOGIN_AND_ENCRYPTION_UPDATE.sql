-- ========================================
-- EMAIL LOGIN AND FULL ENCRYPTION UPDATE
-- ========================================
-- Changes:
-- 1. Use EMAIL as login username for all users
-- 2. Encrypt ALL passwords with AES-256-GCM (not hash)
-- 3. Encrypt system_administrator personal info
-- 4. Remove separate username columns, use email
-- ========================================

USE naga_stall;

-- ========================================
-- STEP 1: DROP AND RECREATE AFFECTED TABLES
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
-- Note: Keep mobile_user_id for mobile authentication
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
-- STEP 2: INSERT SEED DATA (ENCRYPTED)
-- ========================================
-- Note: These will be inserted by Node.js with proper encryption
-- Run the Node.js seed script after this SQL script

SELECT '✅ Tables updated for email login!' AS status;
SELECT 'Run Node.js seed script to insert encrypted admin user' AS next_step;
SELECT 'Default admin email: admin@digistall.com' AS info;
SELECT 'Password will be auto-generated and encrypted' AS note;
