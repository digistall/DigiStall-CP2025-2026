-- ========================================
-- NAGA STALL - CLEAN DATABASE SCHEMA
-- ========================================
-- Version: 2.0 (Clean Reset)
-- Date: January 15, 2026
-- Description: Complete clean database with proper structure
-- Encryption: AES-256-GCM handled in Node.js (not MySQL)
-- ========================================

-- IMPORTANT: Sensitive fields (names, addresses, emails, contact numbers)
-- are stored as encrypted strings (iv:authTag:encrypted format)
-- Encryption/Decryption is done in Node.js, NOT in stored procedures

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Use the database
USE naga_stall;

-- ========================================
-- DROP ALL EXISTING TABLES
-- ========================================

DROP TABLE IF EXISTS violation_report;
DROP TABLE IF EXISTS violation_penalty;
DROP TABLE IF EXISTS violation;
DROP TABLE IF EXISTS vendor_spouse;
DROP TABLE IF EXISTS vendor_documents;
DROP TABLE IF EXISTS vendor_child;
DROP TABLE IF EXISTS vendor_business;
DROP TABLE IF EXISTS vendor;
DROP TABLE IF EXISTS subscription_plans;
DROP TABLE IF EXISTS subscription_payments;
DROP TABLE IF EXISTS stallholder_documents;
DROP TABLE IF EXISTS stallholder_document_submissions;
DROP TABLE IF EXISTS stallholder;
DROP TABLE IF EXISTS stall_images;
DROP TABLE IF EXISTS stall_business_owner;
DROP TABLE IF EXISTS stall_applications;
DROP TABLE IF EXISTS stall;
DROP TABLE IF EXISTS staff_session;
DROP TABLE IF EXISTS staff_activity_log;
DROP TABLE IF EXISTS spouse;
DROP TABLE IF EXISTS section;
DROP TABLE IF EXISTS raffle_result;
DROP TABLE IF EXISTS raffle_participants;
DROP TABLE IF EXISTS raffle_auction_log;
DROP TABLE IF EXISTS raffle;
DROP TABLE IF EXISTS procedure_backup;
DROP TABLE IF EXISTS penalty_payments;
DROP TABLE IF EXISTS payments;
DROP TABLE IF EXISTS payment_status_log;
DROP TABLE IF EXISTS other_information;
DROP TABLE IF EXISTS migrations;
DROP TABLE IF EXISTS inspector_assignment;
DROP TABLE IF EXISTS inspector_action_log;
DROP TABLE IF EXISTS inspector;
DROP TABLE IF EXISTS floor;
DROP TABLE IF EXISTS encryption_keys;
DROP TABLE IF EXISTS employee_session;
DROP TABLE IF EXISTS employee_password_reset;
DROP TABLE IF EXISTS employee_email_template;
DROP TABLE IF EXISTS employee_credential_log;
DROP TABLE IF EXISTS employee_activity_log;
DROP TABLE IF EXISTS document_types;
DROP TABLE IF EXISTS daily_payment;
DROP TABLE IF EXISTS credential;
DROP TABLE IF EXISTS complaint;
DROP TABLE IF EXISTS collector_assignment;
DROP TABLE IF EXISTS collector_action_log;
DROP TABLE IF EXISTS collector;
DROP TABLE IF EXISTS business_owner_subscriptions;
DROP TABLE IF EXISTS business_owner_managers;
DROP TABLE IF EXISTS business_manager;
DROP TABLE IF EXISTS business_information;
DROP TABLE IF EXISTS business_employee;
DROP TABLE IF EXISTS branch_document_requirements;
DROP TABLE IF EXISTS branch;
DROP TABLE IF EXISTS auction_result;
DROP TABLE IF EXISTS auction_bids;
DROP TABLE IF EXISTS auction;
DROP TABLE IF EXISTS assigned_location;
DROP TABLE IF EXISTS application;
DROP TABLE IF EXISTS applicant_documents;
DROP TABLE IF EXISTS applicant;

-- ========================================
-- TABLE: system_administrator
-- ========================================
DROP TABLE IF EXISTS system_administrator;
CREATE TABLE system_administrator (
  system_admin_id INT(11) NOT NULL AUTO_INCREMENT,
  admin_username VARCHAR(50) NOT NULL,
  admin_password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (system_admin_id),
  UNIQUE KEY admin_username (admin_username),
  UNIQUE KEY email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: stall_business_owner
-- ========================================
CREATE TABLE stall_business_owner (
  business_owner_id INT(11) NOT NULL AUTO_INCREMENT,
  owner_username VARCHAR(50) NOT NULL,
  owner_password_hash VARCHAR(255) NOT NULL,
  owner_full_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  email VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
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
  UNIQUE KEY owner_username (owner_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: business_manager
-- ========================================
CREATE TABLE business_manager (
  business_manager_id INT(11) NOT NULL AUTO_INCREMENT,
  manager_username VARCHAR(50) NOT NULL,
  manager_password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  last_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  middle_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  email VARCHAR(500) NOT NULL, -- ENCRYPTED
  contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  address TEXT DEFAULT NULL, -- ENCRYPTED
  status ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  created_by_owner INT(11) DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (business_manager_id),
  UNIQUE KEY manager_username (manager_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: branch
-- ========================================
CREATE TABLE branch (
  branch_id INT(11) NOT NULL AUTO_INCREMENT,
  business_owner_id INT(11) DEFAULT NULL,
  business_manager_id INT(11) DEFAULT NULL,
  branch_name VARCHAR(100) NOT NULL,
  area VARCHAR(100) DEFAULT NULL,
  location VARCHAR(255) DEFAULT NULL,
  address TEXT DEFAULT NULL,
  contact_number VARCHAR(20) DEFAULT NULL,
  email VARCHAR(100) DEFAULT NULL,
  status ENUM('Active','Inactive','Under Construction','Maintenance') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (branch_id),
  KEY idx_business_owner (business_owner_id),
  KEY idx_business_manager (business_manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: business_employee
-- ========================================
CREATE TABLE business_employee (
  business_employee_id INT(11) NOT NULL AUTO_INCREMENT,
  employee_username VARCHAR(50) NOT NULL,
  employee_password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  last_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  middle_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  email VARCHAR(500) NOT NULL, -- ENCRYPTED
  phone_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  address TEXT DEFAULT NULL, -- ENCRYPTED
  branch_id INT(11) NOT NULL,
  created_by_manager INT(11) DEFAULT NULL,
  permissions JSON DEFAULT NULL,
  status ENUM('Active','Inactive','Suspended') DEFAULT 'Active',
  password_reset_required TINYINT(1) DEFAULT 1,
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (business_employee_id),
  UNIQUE KEY employee_username (employee_username),
  KEY idx_branch (branch_id),
  CONSTRAINT fk_employee_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: inspector
-- ========================================
CREATE TABLE inspector (
  inspector_id INT(11) NOT NULL AUTO_INCREMENT,
  inspector_username VARCHAR(50) DEFAULT NULL,
  first_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  last_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  email VARCHAR(500) NOT NULL, -- ENCRYPTED
  contact_no VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  password VARCHAR(255) NOT NULL,
  date_hired DATE DEFAULT NULL,
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (inspector_id),
  UNIQUE KEY inspector_username (inspector_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: inspector_assignment
-- ========================================
CREATE TABLE inspector_assignment (
  assignment_id INT(11) NOT NULL AUTO_INCREMENT,
  inspector_id INT(11) NOT NULL,
  branch_id INT(11) NOT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('Active','Inactive','Transferred') DEFAULT 'Active',
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assignment_id),
  KEY idx_inspector (inspector_id),
  KEY idx_branch (branch_id),
  CONSTRAINT fk_inspector_assignment FOREIGN KEY (inspector_id) REFERENCES inspector(inspector_id),
  CONSTRAINT fk_inspector_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: inspector_action_log
-- ========================================
CREATE TABLE inspector_action_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  inspector_id INT(11) NOT NULL,
  branch_id INT(11) DEFAULT NULL,
  branch_manager_id INT(11) DEFAULT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks TEXT DEFAULT NULL,
  PRIMARY KEY (log_id),
  KEY idx_inspector (inspector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: collector
-- ========================================
CREATE TABLE collector (
  collector_id INT(11) NOT NULL AUTO_INCREMENT,
  collector_username VARCHAR(50) DEFAULT NULL,
  first_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  last_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  email VARCHAR(500) NOT NULL, -- ENCRYPTED
  contact_no VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  password VARCHAR(255) NOT NULL,
  date_hired DATE DEFAULT NULL,
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (collector_id),
  UNIQUE KEY collector_username (collector_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: collector_assignment
-- ========================================
CREATE TABLE collector_assignment (
  assignment_id INT(11) NOT NULL AUTO_INCREMENT,
  collector_id INT(11) NOT NULL,
  branch_id INT(11) NOT NULL,
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  status ENUM('Active','Inactive','Transferred') DEFAULT 'Active',
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assignment_id),
  KEY idx_collector (collector_id),
  KEY idx_branch (branch_id),
  CONSTRAINT fk_collector_assignment FOREIGN KEY (collector_id) REFERENCES collector(collector_id),
  CONSTRAINT fk_collector_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: collector_action_log
-- ========================================
CREATE TABLE collector_action_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  collector_id INT(11) NOT NULL,
  branch_id INT(11) DEFAULT NULL,
  branch_manager_id INT(11) DEFAULT NULL,
  action_type VARCHAR(50) NOT NULL,
  action_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remarks TEXT DEFAULT NULL,
  PRIMARY KEY (log_id),
  KEY idx_collector (collector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: floor
-- ========================================
CREATE TABLE floor (
  floor_id INT(11) NOT NULL AUTO_INCREMENT,
  branch_id INT(11) NOT NULL,
  floor_name VARCHAR(100) NOT NULL,
  floor_number INT(11) DEFAULT 1,
  description TEXT DEFAULT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (floor_id),
  KEY idx_branch (branch_id),
  CONSTRAINT fk_floor_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: section
-- ========================================
CREATE TABLE section (
  section_id INT(11) NOT NULL AUTO_INCREMENT,
  floor_id INT(11) NOT NULL,
  section_name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (section_id),
  KEY idx_floor (floor_id),
  CONSTRAINT fk_section_floor FOREIGN KEY (floor_id) REFERENCES floor(floor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: stall
-- ========================================
CREATE TABLE stall (
  stall_id INT(11) NOT NULL AUTO_INCREMENT,
  section_id INT(11) NOT NULL,
  branch_id INT(11) NOT NULL,
  business_owner_id INT(11) DEFAULT NULL,
  stallholder_id INT(11) DEFAULT NULL,
  stall_number VARCHAR(50) NOT NULL,
  stall_name VARCHAR(100) DEFAULT NULL,
  stall_type VARCHAR(50) DEFAULT NULL,
  size VARCHAR(50) DEFAULT NULL,
  monthly_rent DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('Available','Occupied','Reserved','Maintenance','For Auction','For Raffle') DEFAULT 'Available',
  is_available TINYINT(1) DEFAULT 1,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stall_id),
  KEY idx_section (section_id),
  KEY idx_branch (branch_id),
  KEY idx_stallholder (stallholder_id),
  CONSTRAINT fk_stall_section FOREIGN KEY (section_id) REFERENCES section(section_id),
  CONSTRAINT fk_stall_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: stall_images
-- ========================================
CREATE TABLE stall_images (
  image_id INT(11) NOT NULL AUTO_INCREMENT,
  stall_id INT(11) NOT NULL,
  image_data LONGBLOB NOT NULL,
  image_mime_type VARCHAR(100) DEFAULT 'image/jpeg',
  image_name VARCHAR(255) DEFAULT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  display_order INT(11) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (image_id),
  KEY idx_stall (stall_id),
  CONSTRAINT fk_stall_images FOREIGN KEY (stall_id) REFERENCES stall(stall_id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: applicant (Landing Page Registration)
-- ========================================
CREATE TABLE applicant (
  applicant_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_username VARCHAR(100) DEFAULT NULL,
  applicant_email VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  applicant_password VARCHAR(255) DEFAULT NULL,
  applicant_full_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  applicant_first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  applicant_middle_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  applicant_last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  applicant_contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  applicant_address TEXT DEFAULT NULL, -- ENCRYPTED (stored as TEXT for longer encrypted strings)
  applicant_birthdate DATE DEFAULT NULL,
  applicant_civil_status ENUM('Single','Married','Divorced','Widowed') DEFAULT 'Single',
  applicant_educational_attainment VARCHAR(100) DEFAULT NULL,
  status ENUM('active','inactive','approved','rejected') DEFAULT 'active',
  email_verified TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (applicant_id),
  UNIQUE KEY applicant_username (applicant_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: credential (for mobile app login)
-- ========================================
CREATE TABLE credential (
  credential_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_id INT(11) NOT NULL,
  username VARCHAR(100) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  refresh_token_hash VARCHAR(255) DEFAULT NULL,
  token_expires_at DATETIME DEFAULT NULL,
  last_login DATETIME DEFAULT NULL,
  last_logout DATETIME DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (credential_id),
  UNIQUE KEY username (username),
  KEY idx_applicant (applicant_id),
  CONSTRAINT fk_credential_applicant FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: business_information
-- ========================================
CREATE TABLE business_information (
  business_info_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_id INT(11) NOT NULL,
  nature_of_business VARCHAR(255) DEFAULT NULL,
  capitalization DECIMAL(15,2) DEFAULT NULL,
  source_of_capital VARCHAR(255) DEFAULT NULL,
  previous_business_experience TEXT DEFAULT NULL,
  relative_stall_owner ENUM('Yes','No') DEFAULT 'No',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (business_info_id),
  KEY idx_applicant (applicant_id),
  CONSTRAINT fk_business_info_applicant FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: other_information
-- ========================================
CREATE TABLE other_information (
  other_info_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_id INT(11) NOT NULL,
  signature_of_applicant VARCHAR(500) DEFAULT NULL,
  house_sketch_location VARCHAR(500) DEFAULT NULL,
  valid_id VARCHAR(500) DEFAULT NULL,
  email_address VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (other_info_id),
  KEY idx_applicant (applicant_id),
  CONSTRAINT fk_other_info_applicant FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: spouse
-- ========================================
CREATE TABLE spouse (
  spouse_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_id INT(11) NOT NULL,
  spouse_full_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  spouse_birthdate DATE DEFAULT NULL,
  spouse_educational_attainment VARCHAR(100) DEFAULT NULL,
  spouse_contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  spouse_occupation VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (spouse_id),
  KEY idx_applicant (applicant_id),
  CONSTRAINT fk_spouse_applicant FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: application
-- ========================================
CREATE TABLE application (
  application_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_id INT(11) NOT NULL,
  stall_id INT(11) NOT NULL,
  application_date DATE NOT NULL,
  application_status ENUM('Pending','Under Review','Approved','Rejected','Cancelled') DEFAULT 'Pending',
  reviewed_by INT(11) DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (application_id),
  KEY idx_applicant (applicant_id),
  KEY idx_stall (stall_id),
  CONSTRAINT fk_application_applicant FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id),
  CONSTRAINT fk_application_stall FOREIGN KEY (stall_id) REFERENCES stall(stall_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: applicant_documents
-- ========================================
CREATE TABLE applicant_documents (
  document_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_id INT(11) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) DEFAULT NULL,
  document_data LONGBLOB DEFAULT NULL,
  document_mime_type VARCHAR(100) DEFAULT NULL,
  file_path VARCHAR(500) DEFAULT NULL,
  verification_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  verified_by INT(11) DEFAULT NULL,
  verified_at DATETIME DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (document_id),
  KEY idx_applicant (applicant_id),
  CONSTRAINT fk_applicant_documents FOREIGN KEY (applicant_id) REFERENCES applicant(applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: stallholder (Approved Applicants)
-- ========================================
CREATE TABLE stallholder (
  stallholder_id INT(11) NOT NULL AUTO_INCREMENT,
  applicant_id INT(11) DEFAULT NULL,
  branch_id INT(11) DEFAULT NULL,
  stallholder_name VARCHAR(500) NOT NULL, -- ENCRYPTED
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  middle_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  email VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  address TEXT DEFAULT NULL, -- ENCRYPTED
  stall_id INT(11) DEFAULT NULL,
  monthly_rent DECIMAL(10,2) DEFAULT 0.00,
  contract_start_date DATE DEFAULT NULL,
  contract_end_date DATE DEFAULT NULL,
  payment_status ENUM('paid','unpaid','overdue') DEFAULT 'unpaid',
  last_payment_date DATE DEFAULT NULL,
  status ENUM('active','inactive','suspended','terminated') DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (stallholder_id),
  KEY idx_applicant (applicant_id),
  KEY idx_branch (branch_id),
  KEY idx_stall (stall_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: stallholder_documents
-- ========================================
CREATE TABLE stallholder_documents (
  document_id INT(11) NOT NULL AUTO_INCREMENT,
  stallholder_id INT(11) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_name VARCHAR(255) DEFAULT NULL,
  document_data LONGBLOB DEFAULT NULL,
  document_mime_type VARCHAR(100) DEFAULT NULL,
  verification_status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  verified_by INT(11) DEFAULT NULL,
  verified_at DATETIME DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (document_id),
  KEY idx_stallholder (stallholder_id),
  CONSTRAINT fk_stallholder_documents FOREIGN KEY (stallholder_id) REFERENCES stallholder(stallholder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: stallholder_document_submissions
-- ========================================
CREATE TABLE stallholder_document_submissions (
  submission_id INT(11) NOT NULL AUTO_INCREMENT,
  stallholder_id INT(11) NOT NULL,
  document_requirement_id INT(11) NOT NULL,
  document_data LONGBLOB NOT NULL,
  document_mime_type VARCHAR(100) DEFAULT NULL,
  document_name VARCHAR(255) DEFAULT NULL,
  status ENUM('Pending','Approved','Rejected') DEFAULT 'Pending',
  reviewed_by INT(11) DEFAULT NULL,
  reviewed_at DATETIME DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (submission_id),
  KEY idx_stallholder (stallholder_id),
  CONSTRAINT fk_submission_stallholder FOREIGN KEY (stallholder_id) REFERENCES stallholder(stallholder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: payments
-- ========================================
CREATE TABLE payments (
  payment_id INT(11) NOT NULL AUTO_INCREMENT,
  stallholder_id INT(11) NOT NULL,
  branch_id INT(11) DEFAULT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_time TIME DEFAULT NULL,
  payment_for_month VARCHAR(7) DEFAULT NULL,
  payment_type VARCHAR(50) DEFAULT NULL,
  payment_method ENUM('online','onsite') DEFAULT 'onsite',
  reference_number VARCHAR(100) DEFAULT NULL,
  collected_by VARCHAR(100) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  payment_status ENUM('pending','completed','failed','refunded') DEFAULT 'pending',
  created_by INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (payment_id),
  KEY idx_stallholder (stallholder_id),
  KEY idx_branch (branch_id),
  KEY idx_payment_date (payment_date),
  CONSTRAINT fk_payment_stallholder FOREIGN KEY (stallholder_id) REFERENCES stallholder(stallholder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: daily_payment
-- ========================================
CREATE TABLE daily_payment (
  daily_payment_id INT(11) NOT NULL AUTO_INCREMENT,
  stallholder_id INT(11) NOT NULL,
  payment_date DATE NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status ENUM('paid','unpaid') DEFAULT 'unpaid',
  collected_by INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (daily_payment_id),
  KEY idx_stallholder (stallholder_id),
  KEY idx_payment_date (payment_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: violation
-- ========================================
CREATE TABLE violation (
  violation_id INT(11) NOT NULL AUTO_INCREMENT,
  violation_type VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  default_penalty DECIMAL(10,2) DEFAULT 0.00,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (violation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: violation_penalty
-- ========================================
CREATE TABLE violation_penalty (
  penalty_id INT(11) NOT NULL AUTO_INCREMENT,
  violation_id INT(11) NOT NULL,
  offense_level ENUM('1st','2nd','3rd','4th','5th') NOT NULL,
  penalty_amount DECIMAL(10,2) NOT NULL,
  description TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (penalty_id),
  KEY idx_violation (violation_id),
  CONSTRAINT fk_penalty_violation FOREIGN KEY (violation_id) REFERENCES violation(violation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: violation_report
-- ========================================
CREATE TABLE violation_report (
  report_id INT(11) NOT NULL AUTO_INCREMENT,
  stallholder_id INT(11) NOT NULL,
  violation_id INT(11) NOT NULL,
  reported_by INT(11) DEFAULT NULL,
  report_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  offense_count INT(11) DEFAULT 1,
  penalty_amount DECIMAL(10,2) DEFAULT 0.00,
  payment_status ENUM('Unpaid','Paid','Waived') DEFAULT 'Unpaid',
  paid_date DATE DEFAULT NULL,
  remarks TEXT DEFAULT NULL,
  status ENUM('Open','Resolved','Appealed') DEFAULT 'Open',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (report_id),
  KEY idx_stallholder (stallholder_id),
  KEY idx_violation (violation_id),
  CONSTRAINT fk_report_stallholder FOREIGN KEY (stallholder_id) REFERENCES stallholder(stallholder_id),
  CONSTRAINT fk_report_violation FOREIGN KEY (violation_id) REFERENCES violation(violation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: complaint
-- ========================================
CREATE TABLE complaint (
  complaint_id INT(11) NOT NULL AUTO_INCREMENT,
  complainant_type ENUM('Stallholder','Applicant','Anonymous') NOT NULL,
  complainant_id INT(11) DEFAULT NULL,
  complainant_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  complainant_contact VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  complained_id INT(11) DEFAULT NULL,
  complained_type ENUM('Stallholder','Inspector','Collector','Employee') DEFAULT NULL,
  complaint_type VARCHAR(100) DEFAULT NULL,
  complaint_details TEXT NOT NULL,
  branch_id INT(11) DEFAULT NULL,
  status ENUM('Pending','Under Review','Resolved','Dismissed') DEFAULT 'Pending',
  resolved_by INT(11) DEFAULT NULL,
  resolved_at DATETIME DEFAULT NULL,
  resolution_notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (complaint_id),
  KEY idx_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: document_types
-- ========================================
CREATE TABLE document_types (
  document_type_id INT(11) NOT NULL AUTO_INCREMENT,
  document_name VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  is_required TINYINT(1) DEFAULT 0,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (document_type_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: branch_document_requirements
-- ========================================
CREATE TABLE branch_document_requirements (
  document_requirement_id INT(11) NOT NULL AUTO_INCREMENT,
  branch_id INT(11) NOT NULL,
  document_name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 1,
  created_by INT(11) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (document_requirement_id),
  KEY idx_branch_id (branch_id),
  UNIQUE KEY unique_branch_document (branch_id, document_name),
  CONSTRAINT fk_doc_req_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: raffle
-- ========================================
CREATE TABLE raffle (
  raffle_id INT(11) NOT NULL AUTO_INCREMENT,
  stall_id INT(11) NOT NULL,
  branch_id INT(11) NOT NULL,
  raffle_name VARCHAR(255) DEFAULT NULL,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  draw_date DATETIME DEFAULT NULL,
  status ENUM('Scheduled','Open','Closed','Drawn','Cancelled') DEFAULT 'Scheduled',
  created_by INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (raffle_id),
  KEY idx_stall (stall_id),
  KEY idx_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: raffle_participants
-- ========================================
CREATE TABLE raffle_participants (
  participant_id INT(11) NOT NULL AUTO_INCREMENT,
  raffle_id INT(11) NOT NULL,
  applicant_id INT(11) NOT NULL,
  ticket_number VARCHAR(50) DEFAULT NULL,
  registration_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Registered','Winner','Not Selected') DEFAULT 'Registered',
  PRIMARY KEY (participant_id),
  KEY idx_raffle (raffle_id),
  KEY idx_applicant (applicant_id),
  CONSTRAINT fk_participant_raffle FOREIGN KEY (raffle_id) REFERENCES raffle(raffle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: raffle_result
-- ========================================
CREATE TABLE raffle_result (
  result_id INT(11) NOT NULL AUTO_INCREMENT,
  raffle_id INT(11) NOT NULL,
  winner_participant_id INT(11) NOT NULL,
  draw_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (result_id),
  KEY idx_raffle (raffle_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: auction
-- ========================================
CREATE TABLE auction (
  auction_id INT(11) NOT NULL AUTO_INCREMENT,
  stall_id INT(11) NOT NULL,
  branch_id INT(11) NOT NULL,
  auction_name VARCHAR(255) DEFAULT NULL,
  starting_bid DECIMAL(10,2) NOT NULL,
  minimum_increment DECIMAL(10,2) DEFAULT 100.00,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  status ENUM('Scheduled','Open','Closed','Awarded','Cancelled') DEFAULT 'Scheduled',
  created_by INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (auction_id),
  KEY idx_stall (stall_id),
  KEY idx_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: auction_bids
-- ========================================
CREATE TABLE auction_bids (
  bid_id INT(11) NOT NULL AUTO_INCREMENT,
  auction_id INT(11) NOT NULL,
  applicant_id INT(11) NOT NULL,
  bid_amount DECIMAL(10,2) NOT NULL,
  bid_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Active','Outbid','Winning','Cancelled') DEFAULT 'Active',
  PRIMARY KEY (bid_id),
  KEY idx_auction (auction_id),
  KEY idx_applicant (applicant_id),
  CONSTRAINT fk_bid_auction FOREIGN KEY (auction_id) REFERENCES auction(auction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: auction_result
-- ========================================
CREATE TABLE auction_result (
  result_id INT(11) NOT NULL AUTO_INCREMENT,
  auction_id INT(11) NOT NULL,
  winner_bid_id INT(11) NOT NULL,
  final_amount DECIMAL(10,2) NOT NULL,
  awarded_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (result_id),
  KEY idx_auction (auction_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: subscription_plans
-- ========================================
CREATE TABLE subscription_plans (
  plan_id INT(11) NOT NULL AUTO_INCREMENT,
  plan_name VARCHAR(100) NOT NULL,
  plan_description TEXT DEFAULT NULL,
  price DECIMAL(10,2) NOT NULL,
  duration_months INT(11) DEFAULT 1,
  max_branches INT(11) DEFAULT 1,
  max_stalls INT(11) DEFAULT 50,
  features JSON DEFAULT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: business_owner_subscriptions
-- ========================================
CREATE TABLE business_owner_subscriptions (
  subscription_id INT(11) NOT NULL AUTO_INCREMENT,
  business_owner_id INT(11) NOT NULL,
  plan_id INT(11) NOT NULL,
  subscription_status ENUM('Active','Pending','Expired','Cancelled') DEFAULT 'Pending',
  start_date DATE DEFAULT NULL,
  end_date DATE DEFAULT NULL,
  created_by_system_admin INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (subscription_id),
  KEY idx_owner (business_owner_id),
  KEY idx_plan (plan_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: business_owner_managers
-- ========================================
CREATE TABLE business_owner_managers (
  relationship_id INT(11) NOT NULL AUTO_INCREMENT,
  business_owner_id INT(11) NOT NULL,
  business_manager_id INT(11) NOT NULL,
  is_primary TINYINT(1) DEFAULT 0,
  access_level ENUM('Full','Limited','ReadOnly') DEFAULT 'Full',
  assigned_by_system_admin INT(11) DEFAULT NULL,
  notes TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (relationship_id),
  KEY idx_owner (business_owner_id),
  KEY idx_manager (business_manager_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: staff_session
-- ========================================
CREATE TABLE staff_session (
  session_id INT(11) NOT NULL AUTO_INCREMENT,
  user_type ENUM('SystemAdmin','BusinessOwner','BusinessManager','BusinessEmployee','Inspector','Collector') NOT NULL,
  user_id INT(11) NOT NULL,
  session_token VARCHAR(255) DEFAULT NULL,
  refresh_token_hash VARCHAR(255) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_activity DATETIME DEFAULT NULL,
  logout_time DATETIME DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  PRIMARY KEY (session_id),
  KEY idx_user (user_type, user_id),
  KEY idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: staff_activity_log
-- ========================================
CREATE TABLE staff_activity_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  user_type VARCHAR(50) NOT NULL,
  user_id INT(11) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  action_description TEXT DEFAULT NULL,
  target_type VARCHAR(50) DEFAULT NULL,
  target_id INT(11) DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  user_agent TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_user (user_type, user_id),
  KEY idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: employee_session
-- ========================================
CREATE TABLE employee_session (
  session_id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  session_token VARCHAR(255) DEFAULT NULL,
  login_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_heartbeat DATETIME DEFAULT NULL,
  logout_time DATETIME DEFAULT NULL,
  is_active TINYINT(1) DEFAULT 1,
  PRIMARY KEY (session_id),
  KEY idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: employee_email_template
-- ========================================
CREATE TABLE employee_email_template (
  template_id INT(11) NOT NULL AUTO_INCREMENT,
  template_name VARCHAR(100) NOT NULL,
  template_subject VARCHAR(255) NOT NULL,
  template_body TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: employee_password_reset
-- ========================================
CREATE TABLE employee_password_reset (
  reset_id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  reset_token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  used TINYINT(1) DEFAULT 0,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (reset_id),
  KEY idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: assigned_location
-- ========================================
CREATE TABLE assigned_location (
  assignment_id INT(11) NOT NULL AUTO_INCREMENT,
  user_type ENUM('Inspector','Collector') NOT NULL,
  user_id INT(11) NOT NULL,
  branch_id INT(11) NOT NULL,
  floor_id INT(11) DEFAULT NULL,
  section_id INT(11) DEFAULT NULL,
  assignment_date DATE NOT NULL,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (assignment_id),
  KEY idx_user (user_type, user_id),
  KEY idx_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: vendor (for vendor management)
-- ========================================
CREATE TABLE vendor (
  vendor_id INT(11) NOT NULL AUTO_INCREMENT,
  vendor_username VARCHAR(50) DEFAULT NULL,
  vendor_password VARCHAR(255) DEFAULT NULL,
  first_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  last_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  middle_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  email VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  contact_number VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  address TEXT DEFAULT NULL, -- ENCRYPTED
  birthdate DATE DEFAULT NULL,
  civil_status ENUM('Single','Married','Divorced','Widowed') DEFAULT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (vendor_id),
  UNIQUE KEY vendor_username (vendor_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: vendor_business
-- ========================================
CREATE TABLE vendor_business (
  vendor_business_id INT(11) NOT NULL AUTO_INCREMENT,
  vendor_id INT(11) NOT NULL,
  business_name VARCHAR(255) DEFAULT NULL,
  business_type VARCHAR(100) DEFAULT NULL,
  products_services TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vendor_business_id),
  KEY idx_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: vendor_spouse
-- ========================================
CREATE TABLE vendor_spouse (
  vendor_spouse_id INT(11) NOT NULL AUTO_INCREMENT,
  vendor_id INT(11) NOT NULL,
  spouse_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  spouse_contact VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  spouse_occupation VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vendor_spouse_id),
  KEY idx_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: vendor_child
-- ========================================
CREATE TABLE vendor_child (
  vendor_child_id INT(11) NOT NULL AUTO_INCREMENT,
  vendor_id INT(11) NOT NULL,
  child_name VARCHAR(500) DEFAULT NULL, -- ENCRYPTED
  child_birthdate DATE DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (vendor_child_id),
  KEY idx_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: vendor_documents
-- ========================================
CREATE TABLE vendor_documents (
  document_id INT(11) NOT NULL AUTO_INCREMENT,
  vendor_id INT(11) NOT NULL,
  document_type VARCHAR(100) NOT NULL,
  document_data LONGBLOB DEFAULT NULL,
  document_mime_type VARCHAR(100) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (document_id),
  KEY idx_vendor (vendor_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: migrations (for tracking schema changes)
-- ========================================
CREATE TABLE migrations (
  migration_id INT(11) NOT NULL AUTO_INCREMENT,
  migration_name VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (migration_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: penalty_payments
-- ========================================
CREATE TABLE penalty_payments (
  penalty_payment_id INT(11) NOT NULL AUTO_INCREMENT,
  violation_report_id INT(11) NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) DEFAULT NULL,
  received_by INT(11) DEFAULT NULL,
  PRIMARY KEY (penalty_payment_id),
  KEY idx_violation_report (violation_report_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: payment_status_log
-- ========================================
CREATE TABLE payment_status_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  stallholder_id INT(11) NOT NULL,
  previous_status VARCHAR(50) DEFAULT NULL,
  new_status VARCHAR(50) NOT NULL,
  changed_by VARCHAR(100) DEFAULT 'System',
  changed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_stallholder (stallholder_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: raffle_auction_log
-- ========================================
CREATE TABLE raffle_auction_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  event_type ENUM('Raffle','Auction') NOT NULL,
  event_id INT(11) NOT NULL,
  action VARCHAR(100) NOT NULL,
  performed_by INT(11) DEFAULT NULL,
  details TEXT DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: stall_applications
-- ========================================
CREATE TABLE stall_applications (
  stall_application_id INT(11) NOT NULL AUTO_INCREMENT,
  stall_id INT(11) NOT NULL,
  applicant_id INT(11) NOT NULL,
  application_type ENUM('Direct','Raffle','Auction') DEFAULT 'Direct',
  status ENUM('Pending','Approved','Rejected','Withdrawn') DEFAULT 'Pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (stall_application_id),
  KEY idx_stall (stall_id),
  KEY idx_applicant (applicant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: subscription_payments
-- ========================================
CREATE TABLE subscription_payments (
  payment_id INT(11) NOT NULL AUTO_INCREMENT,
  subscription_id INT(11) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  payment_method VARCHAR(50) DEFAULT NULL,
  reference_number VARCHAR(100) DEFAULT NULL,
  status ENUM('Pending','Completed','Failed','Refunded') DEFAULT 'Pending',
  PRIMARY KEY (payment_id),
  KEY idx_subscription (subscription_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: employee_activity_log
-- ========================================
CREATE TABLE employee_activity_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  action_type VARCHAR(100) NOT NULL,
  description TEXT DEFAULT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLE: employee_credential_log
-- ========================================
CREATE TABLE employee_credential_log (
  log_id INT(11) NOT NULL AUTO_INCREMENT,
  employee_id INT(11) NOT NULL,
  action VARCHAR(50) NOT NULL,
  ip_address VARCHAR(45) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (log_id),
  KEY idx_employee (employee_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
COMMIT;

-- ========================================
-- END OF CLEAN DATABASE SCHEMA
-- ========================================
