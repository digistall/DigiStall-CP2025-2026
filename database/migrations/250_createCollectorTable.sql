-- Migration: 250_createCollectorTable.sql
-- Description: Creates collector table for mobile app credentials
-- Date: 2025-12-09

-- ========================================
-- DROP EXISTING OBJECTS IF THEY EXIST
-- (Drop in correct order due to foreign key constraints)
-- ========================================

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
  `date_hired` date DEFAULT CURDATE(),
  `status` enum('active','inactive') DEFAULT 'active',
  `termination_date` date DEFAULT NULL,
  `termination_reason` varchar(255) DEFAULT NULL,
  `last_login` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`collector_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================
-- CREATE COLLECTOR ASSIGNMENT TABLE
-- ========================================

CREATE TABLE `collector_assignment` (
  `assignment_id` int(11) NOT NULL AUTO_INCREMENT,
  `collector_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `start_date` date DEFAULT CURDATE(),
  `end_date` date DEFAULT NULL,
  `status` enum('Active','Inactive','Transferred') DEFAULT 'Active',
  `remarks` text DEFAULT NULL,
  PRIMARY KEY (`assignment_id`),
  KEY `fk_collector_assignment` (`collector_id`),
  KEY `fk_collector_branch` (`branch_id`),
  CONSTRAINT `fk_collector_assignment` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_collector_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

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
  CONSTRAINT `fk_collector_action_log` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
