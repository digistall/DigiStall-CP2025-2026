-- Migration: 400_vendor_system_complete.sql
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
-- STORED PROCEDURES
-- ========================================

DELIMITER $$

-- ========================================
-- CREATE COLLECTOR PROCEDURE
-- ========================================

CREATE PROCEDURE `createCollector` (
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20),
    IN p_branch_id INT,
    IN p_date_hired DATE,
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE new_collector_id INT;
    DECLARE exit_handler BOOLEAN DEFAULT FALSE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET exit_handler = TRUE;
    
    -- Insert collector
    INSERT INTO collector (
        username,
        password_hash,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        IFNULL(p_date_hired, CURDATE()),
        'active'
    );
    
    IF exit_handler THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to create collector';
    END IF;
    
    SET new_collector_id = LAST_INSERT_ID();
    
    -- Create branch assignment
    INSERT INTO collector_assignment (
        collector_id,
        branch_id,
        start_date,
        status,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        'Newly hired collector'
    );
    
    -- Log the action
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        p_branch_manager_id,
        'New Hire',
        NOW(),
        CONCAT('Collector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id)
    );
    
    -- Return the new collector
    SELECT 
        new_collector_id as collector_id,
        p_username as username,
        p_first_name as first_name,
        p_last_name as last_name,
        p_email as email,
        'Collector created successfully' as message;
END$$

-- ========================================
-- GET COLLECTOR BY ID
-- ========================================

CREATE PROCEDURE `getCollectorById` (
    IN p_collector_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
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

-- ========================================
-- GET COLLECTOR BY USERNAME
-- ========================================

CREATE PROCEDURE `getCollectorByUsername` (
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username AND c.status = 'active'
    LIMIT 1;
END$$

-- ========================================
-- GET ALL COLLECTORS
-- ========================================

CREATE PROCEDURE `getAllCollectors` ()
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    ORDER BY c.last_name, c.first_name;
END$$

-- ========================================
-- GET COLLECTORS BY BRANCH
-- ========================================

CREATE PROCEDURE `getCollectorsByBranch` (
    IN p_branch_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE ca.branch_id = p_branch_id
    ORDER BY c.date_created DESC;
END$$

-- ========================================
-- UPDATE COLLECTOR
-- ========================================

CREATE PROCEDURE `updateCollector` (
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
        first_name = IFNULL(p_first_name, first_name),
        last_name = IFNULL(p_last_name, last_name),
        email = IFNULL(p_email, email),
        contact_no = IFNULL(p_contact_no, contact_no),
        status = IFNULL(p_status, status)
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END$$

-- ========================================
-- UPDATE COLLECTOR LOGIN
-- ========================================

CREATE PROCEDURE `updateCollectorLogin` (
    IN p_collector_id INT
)
BEGIN
    UPDATE collector 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE collector_id = p_collector_id;
END$$

-- ========================================
-- DELETE COLLECTOR (SOFT DELETE)
-- ========================================

CREATE PROCEDURE `deleteCollector` (
    IN p_collector_id INT
)
BEGIN
    UPDATE collector 
    SET status = 'inactive', 
        updated_at = NOW() 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END$$

-- ========================================
-- TERMINATE COLLECTOR
-- ========================================

CREATE PROCEDURE `terminateCollector` (
    IN p_collector_id INT,
    IN p_reason VARCHAR(255),
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_first_name VARCHAR(100);
    DECLARE v_last_name VARCHAR(100);
    
    -- Get current assignment info
    SELECT ca.branch_id, c.first_name, c.last_name 
    INTO v_branch_id, v_first_name, v_last_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    WHERE c.collector_id = p_collector_id
    LIMIT 1;
    
    -- Update collector status
    UPDATE collector 
    SET status = 'inactive',
        termination_date = CURDATE(),
        termination_reason = p_reason
    WHERE collector_id = p_collector_id;
    
    -- Update assignment status
    UPDATE collector_assignment 
    SET status = 'Inactive',
        end_date = CURDATE()
    WHERE collector_id = p_collector_id AND status = 'Active';
    
    -- Log the termination
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        p_collector_id,
        v_branch_id,
        p_branch_manager_id,
        'Termination',
        NOW(),
        CONCAT('Collector ', v_first_name, ' ', v_last_name, ' was terminated. Reason: ', p_reason)
    );
    
    SELECT 'Collector terminated successfully' as message;
END$$

-- ========================================
-- CREATE VENDOR
-- ========================================

CREATE PROCEDURE `createVendor` (
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
        first_name,
        last_name,
        middle_name,
        phone,
        email,
        birthdate,
        gender,
        address,
        business_name,
        business_type,
        business_description,
        vendor_identifier,
        collector_id,
        status
    ) VALUES (
        p_first_name,
        p_last_name,
        p_middle_name,
        p_phone,
        p_email,
        p_birthdate,
        p_gender,
        p_address,
        p_business_name,
        p_business_type,
        p_business_description,
        p_vendor_identifier,
        p_collector_id,
        'Active'
    );
    
    SELECT 
        v.*, 
        c.first_name AS collector_first_name, 
        c.last_name AS collector_last_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    WHERE v.vendor_id = LAST_INSERT_ID();
END$$

-- ========================================
-- GET VENDOR BY ID
-- ========================================

CREATE PROCEDURE `getVendorById` (
    IN p_vendor_id INT
)
BEGIN
    SELECT 
        v.*, 
        c.first_name AS collector_first_name, 
        c.last_name AS collector_last_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    WHERE v.vendor_id = p_vendor_id;
END$$

-- ========================================
-- GET ALL VENDORS
-- ========================================

CREATE PROCEDURE `getAllVendors` ()
BEGIN
    SELECT 
        v.*, 
        c.first_name AS collector_first_name, 
        c.last_name AS collector_last_name
    FROM vendor v
    LEFT JOIN collector c ON v.collector_id = c.collector_id
    ORDER BY v.created_at DESC;
END$$

-- ========================================
-- GET VENDORS BY COLLECTOR ID
-- ========================================

CREATE PROCEDURE `getVendorsByCollectorId` (
    IN p_collector_id INT
)
BEGIN
    SELECT v.* 
    FROM vendor v 
    WHERE v.collector_id = p_collector_id 
    ORDER BY v.last_name, v.first_name;
END$$

-- ========================================
-- UPDATE VENDOR
-- ========================================

CREATE PROCEDURE `updateVendor` (
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
        first_name = IFNULL(p_first_name, first_name),
        last_name = IFNULL(p_last_name, last_name),
        middle_name = p_middle_name,
        phone = IFNULL(p_phone, phone),
        email = p_email,
        birthdate = p_birthdate,
        gender = p_gender,
        address = p_address,
        business_name = IFNULL(p_business_name, business_name),
        business_type = p_business_type,
        business_description = p_business_description,
        vendor_identifier = p_vendor_identifier,
        collector_id = p_collector_id,
        status = IFNULL(p_status, status),
        updated_at = CURRENT_TIMESTAMP
    WHERE vendor_id = p_vendor_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END$$

-- ========================================
-- DELETE VENDOR (SOFT DELETE)
-- ========================================

CREATE PROCEDURE `deleteVendor` (
    IN p_vendor_id INT
)
BEGIN
    UPDATE vendor 
    SET status = 'Inactive', 
        updated_at = NOW() 
    WHERE vendor_id = p_vendor_id;
    
    SELECT ROW_COUNT() AS affected_rows;
END$$

DELIMITER ;

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Additional indexes are already created in table definitions above

-- ========================================
-- SAMPLE DATA (OPTIONAL - UNCOMMENT TO USE)
-- ========================================

/*
-- Sample Collector
INSERT INTO collector (username, password_hash, first_name, last_name, email, contact_no, date_hired, status) VALUES
('COL001', '$2a$12$samplehash123', 'Juan', 'Dela Cruz', 'juan.collector@example.com', '09171234567', CURDATE(), 'active');

-- Sample Vendor
INSERT INTO vendor (first_name, last_name, phone, email, business_name, business_type, vendor_identifier, collector_id, status) VALUES
('Maria', 'Santos', '09181234567', 'maria.vendor@example.com', 'Maria\'s Food Stall', 'Food Service', 'VEN001', 1, 'Active');
*/

-- ========================================
-- MIGRATION COMPLETE
-- ========================================

SELECT 'Vendor system migration completed successfully!' AS status;
