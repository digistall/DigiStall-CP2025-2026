-- Migration: 403_vendor_system_complete.sql
-- Description: Complete vendor and collector system with tables and stored procedures
-- Date: 2026-01-05
-- Tables: vendor, collector, collector_assignment, collector_action_log
-- Procedures: All vendor and collector related stored procedures

-- ========================================
-- DROP EXISTING OBJECTS IF THEY EXIST
-- ========================================

DROP PROCEDURE IF EXISTS `createVendor`;
DROP PROCEDURE IF EXISTS `getAllVendors`;
DROP PROCEDURE IF EXISTS `getVendorById`;
DROP PROCEDURE IF EXISTS `updateVendor`;
DROP PROCEDURE IF EXISTS `deleteVendor`;
DROP PROCEDURE IF EXISTS `getVendorsByCollectorId`;
DROP PROCEDURE IF EXISTS `createCollector`;
DROP PROCEDURE IF EXISTS `getAllCollectors`;
DROP PROCEDURE IF EXISTS `getCollectorById`;
DROP PROCEDURE IF EXISTS `updateCollector`;
DROP PROCEDURE IF EXISTS `deleteCollector`;
DROP PROCEDURE IF EXISTS `getCollectorByUsername`;
DROP PROCEDURE IF EXISTS `getCollectorsByBranch`;
DROP PROCEDURE IF EXISTS `updateCollectorLogin`;
DROP PROCEDURE IF EXISTS `terminateCollector`;

DROP TABLE IF EXISTS `vendor`;
DROP TABLE IF EXISTS `collector_action_log`;
DROP TABLE IF EXISTS `collector_assignment`;
DROP TABLE IF EXISTS `collector`;

-- ========================================
-- CREATE COLLECTOR TABLE
-- ========================================

CREATE TABLE `collector` (
  `collector_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL UNIQUE,
  `password_hash` varchar(255) NOT NULL,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `email` varchar(255) NOT NULL UNIQUE,
  `contact_no` varchar(20) DEFAULT NULL,
  `date_created` datetime DEFAULT CURRENT_TIMESTAMP,
  `date_hired` date DEFAULT NULL,
  `status` enum('active','inactive') DEFAULT 'active',
  `termination_date` date DEFAULT NULL,
  `termination_reason` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`collector_id`),
  KEY `idx_collector_username` (`username`),
  KEY `idx_collector_email` (`email`),
  KEY `idx_collector_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Cash ticket collectors for vendor management';

-- ========================================
-- CREATE COLLECTOR ASSIGNMENT TABLE
-- ========================================

CREATE TABLE `collector_assignment` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `collector_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` enum('Active','Inactive','Transferred') DEFAULT 'Active',
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `fk_collector_assignment` (`collector_id`),
  KEY `fk_collector_branch` (`branch_id`),
  KEY `idx_assignment_status` (`status`),
  CONSTRAINT `fk_collector_assignment` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_collector_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Tracks collector assignments to branches';

-- ========================================
-- CREATE COLLECTOR ACTION LOG TABLE
-- ========================================

CREATE TABLE `collector_action_log` (
  `action_id` int(11) NOT NULL AUTO_INCREMENT,
  `collector_id` int(11) NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `business_manager_id` int(11) DEFAULT NULL,
  `action_type` enum('New Hire','Termination','Rehire','Transfer') NOT NULL,
  `action_date` datetime DEFAULT CURRENT_TIMESTAMP,
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`action_id`),
  KEY `fk_collector_action_log` (`collector_id`),
  KEY `idx_action_type` (`action_type`),
  KEY `idx_action_date` (`action_date`),
  CONSTRAINT `fk_collector_action_log` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Audit log for collector actions';

-- ========================================
-- CREATE VENDOR TABLE
-- ========================================

CREATE TABLE `vendor` (
  `vendor_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `middle_name` varchar(100) DEFAULT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `business_name` varchar(255) DEFAULT NULL,
  `business_type` varchar(100) DEFAULT NULL,
  `business_description` text DEFAULT NULL,
  `vendor_identifier` varchar(100) DEFAULT NULL COMMENT 'Unique vendor ID or code',
  `collector_id` int(11) DEFAULT NULL COMMENT 'Assigned collector for this vendor',
  `status` enum('Active','Inactive','Pending','Suspended') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`vendor_id`),
  KEY `fk_vendor_collector` (`collector_id`),
  KEY `idx_vendor_status` (`status`),
  KEY `idx_vendor_name` (`last_name`, `first_name`),
  KEY `idx_vendor_identifier` (`vendor_identifier`),
  CONSTRAINT `fk_vendor_collector` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci COMMENT='Vendor applicants and active vendors';

-- ========================================
-- STORED PROCEDURES FOR VENDOR MANAGEMENT
-- ========================================

DELIMITER $$

-- Create Vendor
CREATE PROCEDURE `createVendor`(
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_business_description TEXT,
    IN p_vendor_identifier VARCHAR(100),
    IN p_collector_id INT
)
BEGIN
    INSERT INTO vendor (
        first_name, last_name, middle_name, phone, email, 
        birthdate, gender, address, business_name, business_type,
        business_description, vendor_identifier, collector_id
    ) VALUES (
        p_first_name, p_last_name, p_middle_name, p_phone, p_email,
        p_birthdate, p_gender, p_address, p_business_name, p_business_type,
        p_business_description, p_vendor_identifier, p_collector_id
    );
    
    SELECT LAST_INSERT_ID() AS vendor_id;
END$$

-- Get All Vendors
CREATE PROCEDURE `getAllVendors`()
BEGIN
    SELECT 
        v.*,
        CONCAT(c.first_name, ' ', c.last_name) AS collector_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    ORDER BY v.created_at DESC;
END$$

-- Get Vendor By ID
CREATE PROCEDURE `getVendorById`(IN p_vendor_id INT)
BEGIN
    SELECT 
        v.*,
        CONCAT(c.first_name, ' ', c.last_name) AS collector_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    WHERE v.vendor_id = p_vendor_id;
END$$

-- Get Vendors By Collector ID
CREATE PROCEDURE `getVendorsByCollectorId`(IN p_collector_id INT)
BEGIN
    SELECT 
        v.*,
        CONCAT(c.first_name, ' ', c.last_name) AS collector_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    WHERE v.collector_id = p_collector_id
    ORDER BY v.created_at DESC;
END$$

-- Update Vendor
CREATE PROCEDURE `updateVendor`(
    IN p_vendor_id INT,
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_phone VARCHAR(20),
    IN p_email VARCHAR(255),
    IN p_birthdate DATE,
    IN p_gender VARCHAR(20),
    IN p_address TEXT,
    IN p_business_name VARCHAR(255),
    IN p_business_type VARCHAR(100),
    IN p_business_description TEXT,
    IN p_vendor_identifier VARCHAR(100),
    IN p_collector_id INT,
    IN p_status VARCHAR(20)
)
BEGIN
    UPDATE vendor SET
        first_name = p_first_name,
        last_name = p_last_name,
        middle_name = p_middle_name,
        phone = p_phone,
        email = p_email,
        birthdate = p_birthdate,
        gender = p_gender,
        address = p_address,
        business_name = p_business_name,
        business_type = p_business_type,
        business_description = p_business_description,
        vendor_identifier = p_vendor_identifier,
        collector_id = p_collector_id,
        status = p_status
    WHERE vendor_id = p_vendor_id;
END$$

-- Delete Vendor (Soft Delete - Set Status to Inactive)
CREATE PROCEDURE `deleteVendor`(IN p_vendor_id INT)
BEGIN
    UPDATE vendor SET status = 'Inactive' WHERE vendor_id = p_vendor_id;
END$$

DELIMITER ;
