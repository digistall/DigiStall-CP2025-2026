-- ========================================
-- MIGRATION: 008_vendors_collectors.sql
-- Description: Create vendor and collector tables and stored procedures
-- Version: 1.0.0
-- Created: 2025-11-18
-- ========================================

USE `naga_stall`;

DELIMITER $$

-- ========================================
-- COLLECTOR TABLE + PROCEDURES
-- ========================================

CREATE TABLE IF NOT EXISTS `collector` (
  `collector_id` int(11) NOT NULL AUTO_INCREMENT,
  `first_name` varchar(100) NOT NULL,
  `last_name` varchar(100) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`collector_id`),
  KEY `branch_id` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;$$

DROP PROCEDURE IF EXISTS `createCollector`$$
CREATE PROCEDURE `createCollector`(
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_contact_no VARCHAR(20),
  IN p_branch_id INT
)
BEGIN
  INSERT INTO collector (first_name, last_name, email, contact_number, branch_id)
  VALUES (p_first_name, p_last_name, p_email, p_contact_no, p_branch_id);
  SELECT * FROM collector WHERE collector_id = LAST_INSERT_ID();
END$$

DROP PROCEDURE IF EXISTS `getAllCollectors`$$
CREATE PROCEDURE `getAllCollectors`()
BEGIN
  SELECT * FROM collector ORDER BY last_name, first_name;
END$$

DROP PROCEDURE IF EXISTS `getCollectorById`$$
CREATE PROCEDURE `getCollectorById`(IN p_collector_id INT)
BEGIN
  SELECT * FROM collector WHERE collector_id = p_collector_id;
END$$

DROP PROCEDURE IF EXISTS `updateCollector`$$
CREATE PROCEDURE `updateCollector`(
  IN p_collector_id INT,
  IN p_first_name VARCHAR(100),
  IN p_last_name VARCHAR(100),
  IN p_email VARCHAR(255),
  IN p_contact_no VARCHAR(20),
  IN p_branch_id INT,
  IN p_status VARCHAR(20)
)
BEGIN
  UPDATE collector SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    email = COALESCE(p_email, email),
    contact_number = COALESCE(p_contact_no, contact_number),
    branch_id = COALESCE(p_branch_id, branch_id),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE collector_id = p_collector_id;

  SELECT ROW_COUNT() AS affected_rows;
END$$

DROP PROCEDURE IF EXISTS `deleteCollector`$$
CREATE PROCEDURE `deleteCollector`(IN p_collector_id INT)
BEGIN
  UPDATE collector SET status = 'Inactive', updated_at = NOW() WHERE collector_id = p_collector_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

-- ========================================
-- VENDOR TABLE + PROCEDURES
-- ========================================

CREATE TABLE IF NOT EXISTS `vendor` (
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
  `vendor_identifier` varchar(100) DEFAULT NULL,
  `collector_id` int(11) DEFAULT NULL,
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`vendor_id`),
  KEY `collector_id` (`collector_id`),
  CONSTRAINT `fk_vendor_collector` FOREIGN KEY (`collector_id`) REFERENCES `collector` (`collector_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;$$

DROP PROCEDURE IF EXISTS `createVendor`$$
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
    first_name, last_name, middle_name, phone, email, birthdate, gender, address,
    business_name, business_type, business_description, vendor_identifier, collector_id
  ) VALUES (
    p_first_name, p_last_name, p_middle_name, p_phone, p_email, p_birthdate, p_gender, p_address,
    p_business_name, p_business_type, p_business_description, p_vendor_identifier, p_collector_id
  );

  SELECT v.*, c.first_name AS collector_first_name, c.last_name AS collector_last_name
  FROM vendor v
  LEFT JOIN collector c ON v.collector_id = c.collector_id
  WHERE v.vendor_id = LAST_INSERT_ID();
END$$

DROP PROCEDURE IF EXISTS `getAllVendors`$$
CREATE PROCEDURE `getAllVendors`()
BEGIN
  SELECT v.*, c.first_name AS collector_first_name, c.last_name AS collector_last_name
  FROM vendor v
  LEFT JOIN collector c ON v.collector_id = c.collector_id
  ORDER BY v.created_at DESC;
END$$

DROP PROCEDURE IF EXISTS `getVendorById`$$
CREATE PROCEDURE `getVendorById`(IN p_vendor_id INT)
BEGIN
  SELECT v.*, c.first_name AS collector_first_name, c.last_name AS collector_last_name
  FROM vendor v
  LEFT JOIN collector c ON v.collector_id = c.collector_id
  WHERE v.vendor_id = p_vendor_id;
END$$

DROP PROCEDURE IF EXISTS `getVendorsByCollectorId`$$
CREATE PROCEDURE `getVendorsByCollectorId`(IN p_collector_id INT)
BEGIN
  SELECT v.* FROM vendor v WHERE v.collector_id = p_collector_id ORDER BY v.last_name, v.first_name;
END$$

DROP PROCEDURE IF EXISTS `updateVendor`$$
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
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    middle_name = COALESCE(p_middle_name, middle_name),
    phone = COALESCE(p_phone, phone),
    email = COALESCE(p_email, email),
    birthdate = COALESCE(p_birthdate, birthdate),
    gender = COALESCE(p_gender, gender),
    address = COALESCE(p_address, address),
    business_name = COALESCE(p_business_name, business_name),
    business_type = COALESCE(p_business_type, business_type),
    business_description = COALESCE(p_business_description, business_description),
    vendor_identifier = COALESCE(p_vendor_identifier, vendor_identifier),
    collector_id = COALESCE(p_collector_id, collector_id),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE vendor_id = p_vendor_id;

  SELECT ROW_COUNT() AS affected_rows;
END$$

DROP PROCEDURE IF EXISTS `deleteVendor`$$
CREATE PROCEDURE `deleteVendor`(IN p_vendor_id INT)
BEGIN
  UPDATE vendor SET status = 'Inactive', updated_at = NOW() WHERE vendor_id = p_vendor_id;
  SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;

-- Record migration execution
INSERT IGNORE INTO migrations (migration_name, version) VALUES ('008_vendors_collectors', '1.0.0');
