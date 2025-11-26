-- Migration 024: Role System Restructure
-- Purpose: Rename roles and create System Administrator
-- Date: 2025-11-26
-- Version: 1.0.0

-- Role Mapping:
-- admin → stall_business_owner
-- branch_manager → business_manager  
-- employee → business_employee
-- NEW: system_administrator

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================================
-- STEP 1: CREATE SYSTEM_ADMINISTRATOR TABLE
-- =====================================================================

CREATE TABLE IF NOT EXISTS `system_administrator` (
  `system_admin_id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `contact_number` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`system_admin_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- =====================================================================
-- STEP 2: RENAME ADMIN TABLE TO STALL_BUSINESS_OWNER
-- =====================================================================

-- Create new table with updated structure
CREATE TABLE IF NOT EXISTS `stall_business_owner` (
  `business_owner_id` INT(11) NOT NULL AUTO_INCREMENT,
  `owner_username` VARCHAR(50) NOT NULL,
  `owner_password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(50) DEFAULT NULL,
  `last_name` VARCHAR(50) DEFAULT NULL,
  `contact_number` VARCHAR(20) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_by_system_admin` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`business_owner_id`),
  UNIQUE KEY `owner_username` (`owner_username`),
  UNIQUE KEY `email` (`email`),
  KEY `fk_owner_created_by` (`created_by_system_admin`),
  CONSTRAINT `fk_owner_created_by_sysadmin` FOREIGN KEY (`created_by_system_admin`) 
    REFERENCES `system_administrator` (`system_admin_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrate data from admin to stall_business_owner
INSERT INTO `stall_business_owner` 
  (`business_owner_id`, `owner_username`, `owner_password_hash`, `first_name`, `last_name`, 
   `contact_number`, `email`, `status`, `created_at`)
SELECT 
  `admin_id`, `admin_username`, `admin_password_hash`, `first_name`, `last_name`,
  `contact_number`, `email`, `status`, `created_at`
FROM `admin`;

-- =====================================================================
-- STEP 3: RENAME BRANCH_MANAGER TABLE TO BUSINESS_MANAGER
-- =====================================================================

CREATE TABLE IF NOT EXISTS `business_manager` (
  `business_manager_id` INT(11) NOT NULL AUTO_INCREMENT,
  `branch_id` INT(11) NOT NULL,
  `manager_username` VARCHAR(50) NOT NULL,
  `manager_password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `contact_number` VARCHAR(20) DEFAULT NULL,
  `status` ENUM('Active', 'Inactive') DEFAULT 'Active',
  `created_by_owner` INT(11) DEFAULT NULL,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`business_manager_id`),
  UNIQUE KEY `manager_username` (`manager_username`),
  KEY `branch_id` (`branch_id`),
  KEY `fk_manager_created_by` (`created_by_owner`),
  CONSTRAINT `fk_business_manager_branch` FOREIGN KEY (`branch_id`) 
    REFERENCES `branch` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_manager_created_by_owner` FOREIGN KEY (`created_by_owner`) 
    REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrate data from branch_manager to business_manager
INSERT INTO `business_manager` 
  (`business_manager_id`, `branch_id`, `manager_username`, `manager_password_hash`, 
   `first_name`, `last_name`, `email`, `contact_number`, `status`, `created_at`, `updated_at`)
SELECT 
  `branch_manager_id`, `branch_id`, `manager_username`, `manager_password_hash`,
  `first_name`, `last_name`, `email`, `contact_number`, `status`, `created_at`, `updated_at`
FROM `branch_manager`;

-- =====================================================================
-- STEP 4: RENAME EMPLOYEE TABLE TO BUSINESS_EMPLOYEE
-- =====================================================================

CREATE TABLE IF NOT EXISTS `business_employee` (
  `business_employee_id` INT(11) NOT NULL AUTO_INCREMENT,
  `employee_username` VARCHAR(50) NOT NULL,
  `employee_password_hash` VARCHAR(255) NOT NULL,
  `first_name` VARCHAR(100) NOT NULL,
  `last_name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone_number` VARCHAR(20) DEFAULT NULL,
  `branch_id` INT(11) DEFAULT NULL,
  `created_by_manager` INT(11) DEFAULT NULL,
  `permissions` JSON DEFAULT NULL COMMENT 'Employee permissions object',
  `status` ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
  `last_login` TIMESTAMP NULL DEFAULT NULL,
  `password_reset_required` TINYINT(1) DEFAULT 0,
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`business_employee_id`),
  UNIQUE KEY `employee_username` (`employee_username`),
  UNIQUE KEY `email` (`email`),
  KEY `created_by_manager` (`created_by_manager`),
  KEY `idx_employee_branch` (`branch_id`),
  KEY `idx_employee_status` (`status`),
  CONSTRAINT `fk_business_employee_branch` FOREIGN KEY (`branch_id`) 
    REFERENCES `branch` (`branch_id`) ON DELETE SET NULL,
  CONSTRAINT `fk_business_employee_manager` FOREIGN KEY (`created_by_manager`) 
    REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Migrate data from employee to business_employee
INSERT INTO `business_employee` 
  (`business_employee_id`, `employee_username`, `employee_password_hash`, `first_name`, 
   `last_name`, `email`, `phone_number`, `branch_id`, `created_by_manager`, `permissions`, 
   `status`, `last_login`, `password_reset_required`, `created_at`, `updated_at`)
SELECT 
  `employee_id`, `employee_username`, `employee_password_hash`, `first_name`,
  `last_name`, `email`, `phone_number`, `branch_id`, `created_by_manager`, `permissions`,
  `status`, `last_login`, `password_reset_required`, `created_at`, `updated_at`
FROM `employee`;

-- =====================================================================
-- STEP 5: UPDATE BRANCH TABLE FOREIGN KEY
-- =====================================================================

-- Update branch table to reference stall_business_owner
ALTER TABLE `branch` DROP FOREIGN KEY IF EXISTS `branch_ibfk_1`;
ALTER TABLE `branch` CHANGE `admin_id` `business_owner_id` INT(11) NOT NULL;
ALTER TABLE `branch` ADD CONSTRAINT `fk_branch_owner` 
  FOREIGN KEY (`business_owner_id`) REFERENCES `stall_business_owner` (`business_owner_id`) ON DELETE CASCADE;

-- =====================================================================
-- STEP 6: UPDATE EMPLOYEE-RELATED TABLES
-- =====================================================================

-- Update employee_session
ALTER TABLE `employee_session` DROP FOREIGN KEY IF EXISTS `employee_session_ibfk_1`;
ALTER TABLE `employee_session` CHANGE `employee_id` `business_employee_id` INT(11) NOT NULL;
ALTER TABLE `employee_session` ADD CONSTRAINT `fk_employee_session_employee` 
  FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE CASCADE;

-- Update employee_activity_log
ALTER TABLE `employee_activity_log` DROP FOREIGN KEY IF EXISTS `employee_activity_log_ibfk_1`;
ALTER TABLE `employee_activity_log` DROP FOREIGN KEY IF EXISTS `employee_activity_log_ibfk_2`;
ALTER TABLE `employee_activity_log` CHANGE `employee_id` `business_employee_id` INT(11) DEFAULT NULL;
ALTER TABLE `employee_activity_log` CHANGE `performed_by` `performed_by_manager` INT(11) DEFAULT NULL;
ALTER TABLE `employee_activity_log` ADD CONSTRAINT `fk_activity_log_employee` 
  FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE SET NULL;
ALTER TABLE `employee_activity_log` ADD CONSTRAINT `fk_activity_log_manager` 
  FOREIGN KEY (`performed_by_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

-- Update employee_credential_log
ALTER TABLE `employee_credential_log` DROP FOREIGN KEY IF EXISTS `employee_credential_log_ibfk_1`;
ALTER TABLE `employee_credential_log` DROP FOREIGN KEY IF EXISTS `employee_credential_log_ibfk_2`;
ALTER TABLE `employee_credential_log` CHANGE `employee_id` `business_employee_id` INT(11) NOT NULL;
ALTER TABLE `employee_credential_log` CHANGE `generated_by` `generated_by_manager` INT(11) DEFAULT NULL;
ALTER TABLE `employee_credential_log` ADD CONSTRAINT `fk_credential_log_employee` 
  FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE CASCADE;
ALTER TABLE `employee_credential_log` ADD CONSTRAINT `fk_credential_log_manager` 
  FOREIGN KEY (`generated_by_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

-- Update employee_password_reset
ALTER TABLE `employee_password_reset` DROP FOREIGN KEY IF EXISTS `employee_password_reset_ibfk_1`;
ALTER TABLE `employee_password_reset` DROP FOREIGN KEY IF EXISTS `employee_password_reset_ibfk_2`;
ALTER TABLE `employee_password_reset` CHANGE `employee_id` `business_employee_id` INT(11) NOT NULL;
ALTER TABLE `employee_password_reset` CHANGE `requested_by` `requested_by_manager` INT(11) DEFAULT NULL;
ALTER TABLE `employee_password_reset` ADD CONSTRAINT `fk_password_reset_employee` 
  FOREIGN KEY (`business_employee_id`) REFERENCES `business_employee` (`business_employee_id`) ON DELETE CASCADE;
ALTER TABLE `employee_password_reset` ADD CONSTRAINT `fk_password_reset_manager` 
  FOREIGN KEY (`requested_by_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

-- =====================================================================
-- STEP 7: UPDATE ALL REFERENCES TO MANAGERS
-- =====================================================================

-- Update stall table
ALTER TABLE `stall` DROP FOREIGN KEY IF EXISTS `fk_stall_created_by_manager`;
ALTER TABLE `stall` CHANGE `created_by_manager` `created_by_business_manager` INT(11) DEFAULT NULL;
ALTER TABLE `stall` ADD CONSTRAINT `fk_stall_created_by_manager` 
  FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

-- Update stallholder table
ALTER TABLE `stallholder` DROP FOREIGN KEY IF EXISTS `fk_stallholder_created_by`;
ALTER TABLE `stallholder` CHANGE `created_by_manager` `created_by_business_manager` INT(11) DEFAULT NULL;
ALTER TABLE `stallholder` ADD CONSTRAINT `fk_stallholder_created_by_manager` 
  FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL;

-- Update raffle table
ALTER TABLE `raffle` DROP FOREIGN KEY IF EXISTS `fk_raffle_manager`;
ALTER TABLE `raffle` CHANGE `created_by_manager` `created_by_business_manager` INT(11) NOT NULL;
ALTER TABLE `raffle` ADD CONSTRAINT `fk_raffle_business_manager` 
  FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE;

-- Update auction table
ALTER TABLE `auction` DROP FOREIGN KEY IF EXISTS `fk_auction_manager`;
ALTER TABLE `auction` CHANGE `created_by_manager` `created_by_business_manager` INT(11) NOT NULL;
ALTER TABLE `auction` ADD CONSTRAINT `fk_auction_business_manager` 
  FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE;

-- Update raffle_auction_log table
ALTER TABLE `raffle_auction_log` DROP FOREIGN KEY IF EXISTS `fk_log_manager`;
ALTER TABLE `raffle_auction_log` CHANGE `performed_by_manager` `performed_by_business_manager` INT(11) NOT NULL;
ALTER TABLE `raffle_auction_log` ADD CONSTRAINT `fk_log_business_manager` 
  FOREIGN KEY (`performed_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE;

-- Update raffle_result table
ALTER TABLE `raffle_result` DROP FOREIGN KEY IF EXISTS `fk_raffle_result_manager`;
ALTER TABLE `raffle_result` CHANGE `awarded_by_manager` `awarded_by_business_manager` INT(11) NOT NULL;
ALTER TABLE `raffle_result` ADD CONSTRAINT `fk_raffle_result_business_manager` 
  FOREIGN KEY (`awarded_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE;

-- Update auction_result table
ALTER TABLE `auction_result` DROP FOREIGN KEY IF EXISTS `fk_auction_result_manager`;
ALTER TABLE `auction_result` CHANGE `awarded_by_manager` `awarded_by_business_manager` INT(11) NOT NULL;
ALTER TABLE `auction_result` ADD CONSTRAINT `fk_auction_result_business_manager` 
  FOREIGN KEY (`awarded_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE;

-- Update branch_document_requirements table
ALTER TABLE `branch_document_requirements` DROP FOREIGN KEY IF EXISTS `fk_requirement_manager`;
ALTER TABLE `branch_document_requirements` CHANGE `created_by_manager` `created_by_business_manager` INT(11) NOT NULL;
ALTER TABLE `branch_document_requirements` ADD CONSTRAINT `fk_requirement_business_manager` 
  FOREIGN KEY (`created_by_business_manager`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE CASCADE;

-- Update inspector_action_log table
ALTER TABLE `inspector_action_log` DROP FOREIGN KEY IF EXISTS `inspector_action_log_ibfk_3`;
ALTER TABLE `inspector_action_log` CHANGE `branch_manager_id` `business_manager_id` INT(11) DEFAULT NULL;
ALTER TABLE `inspector_action_log` ADD CONSTRAINT `fk_inspector_action_log_manager` 
  FOREIGN KEY (`business_manager_id`) REFERENCES `business_manager` (`business_manager_id`) ON DELETE SET NULL ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================================
-- STEP 8: INSERT DEFAULT SYSTEM ADMINISTRATOR
-- =====================================================================

-- Create a default system administrator account
-- Username: sysadmin, Password: SysAdmin@2025 (hashed with bcrypt)
INSERT INTO `system_administrator` 
  (`username`, `password_hash`, `first_name`, `last_name`, `contact_number`, `email`, `status`) 
VALUES 
  ('sysadmin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyWmQzJ5eC9i', 
   'System', 'Administrator', '+63900000000', 'sysadmin@nagastall.com', 'Active');

-- =====================================================================
-- RECORD MIGRATION
-- =====================================================================

INSERT INTO `migrations` (`migration_name`, `version`, `executed_at`)
VALUES ('024_role_system_restructure', '1.0.0', NOW());

SELECT '✅ Migration 024: Role System Restructure completed successfully!' AS status;
