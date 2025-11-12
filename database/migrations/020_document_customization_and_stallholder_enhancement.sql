-- Migration: Document Customization and Enhanced Stallholder Management
-- Version: 1.0.0
-- Date: November 12, 2025

-- ================================
-- 1. Document Customization Tables
-- ================================

-- Table for storing document types that can be required
CREATE TABLE IF NOT EXISTS `document_types` (
  `document_type_id` int(11) NOT NULL AUTO_INCREMENT,
  `document_name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `is_system_default` tinyint(1) DEFAULT 0 COMMENT 'System-wide document types that cannot be deleted',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`document_type_id`),
  UNIQUE KEY `unique_document_name` (`document_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for branch-specific document requirements
CREATE TABLE IF NOT EXISTS `branch_document_requirements` (
  `requirement_id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) NOT NULL,
  `document_type_id` int(11) NOT NULL,
  `is_required` tinyint(1) DEFAULT 1 COMMENT 'Whether this document is mandatory for stallholders in this branch',
  `instructions` text DEFAULT NULL COMMENT 'Special instructions for this document in this branch',
  `created_by_manager` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`requirement_id`),
  UNIQUE KEY `unique_branch_document` (`branch_id`, `document_type_id`),
  KEY `idx_branch_requirements` (`branch_id`),
  KEY `idx_document_requirements` (`document_type_id`),
  KEY `idx_manager_requirements` (`created_by_manager`),
  CONSTRAINT `fk_requirement_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_requirement_document_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`document_type_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_requirement_manager` FOREIGN KEY (`created_by_manager`) REFERENCES `branch_manager` (`branch_manager_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table for storing stallholder documents
CREATE TABLE IF NOT EXISTS `stallholder_documents` (
  `document_id` int(11) NOT NULL AUTO_INCREMENT,
  `stallholder_id` int(11) NOT NULL,
  `document_type_id` int(11) NOT NULL,
  `file_path` varchar(500) DEFAULT NULL,
  `original_filename` varchar(255) DEFAULT NULL,
  `file_size` bigint(20) DEFAULT NULL,
  `upload_date` timestamp NOT NULL DEFAULT current_timestamp(),
  `verification_status` enum('pending','verified','rejected','expired') DEFAULT 'pending',
  `verified_by` int(11) DEFAULT NULL COMMENT 'Employee or manager who verified',
  `verified_at` timestamp NULL DEFAULT NULL,
  `rejection_reason` text DEFAULT NULL,
  `expiry_date` date DEFAULT NULL COMMENT 'For documents that expire',
  `notes` text DEFAULT NULL,
  PRIMARY KEY (`document_id`),
  UNIQUE KEY `unique_stallholder_document` (`stallholder_id`, `document_type_id`),
  KEY `idx_stallholder_docs` (`stallholder_id`),
  KEY `idx_document_type` (`document_type_id`),
  KEY `idx_verification_status` (`verification_status`),
  KEY `idx_verified_by` (`verified_by`),
  CONSTRAINT `fk_document_stallholder` FOREIGN KEY (`stallholder_id`) REFERENCES `stallholder` (`stallholder_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_document_type` FOREIGN KEY (`document_type_id`) REFERENCES `document_types` (`document_type_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ================================
-- 2. Enhanced Stallholder Table Updates
-- ================================

-- Add additional fields to stallholder table for better management
ALTER TABLE `stallholder` 
ADD COLUMN IF NOT EXISTS `contact_number` varchar(20) DEFAULT NULL AFTER `stallholder_name`,
ADD COLUMN IF NOT EXISTS `email` varchar(255) DEFAULT NULL AFTER `contact_number`,
ADD COLUMN IF NOT EXISTS `address` text DEFAULT NULL AFTER `email`,
ADD COLUMN IF NOT EXISTS `business_name` varchar(255) DEFAULT NULL AFTER `address`,
ADD COLUMN IF NOT EXISTS `business_type` varchar(100) DEFAULT NULL AFTER `business_name`,
ADD COLUMN IF NOT EXISTS `stall_id` int(11) DEFAULT NULL AFTER `branch_id`,
ADD COLUMN IF NOT EXISTS `monthly_rent` decimal(10,2) DEFAULT NULL AFTER `lease_amount`,
ADD COLUMN IF NOT EXISTS `payment_status` enum('current','overdue','grace_period') DEFAULT 'current' AFTER `monthly_rent`,
ADD COLUMN IF NOT EXISTS `last_payment_date` date DEFAULT NULL AFTER `payment_status`,
ADD COLUMN IF NOT EXISTS `notes` text DEFAULT NULL AFTER `last_payment_date`,
ADD COLUMN IF NOT EXISTS `created_by_manager` int(11) DEFAULT NULL AFTER `notes`,
ADD COLUMN IF NOT EXISTS `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp() AFTER `date_created`;

-- Add foreign key constraint for stall_id
ALTER TABLE `stallholder` 
ADD CONSTRAINT `fk_stallholder_stall` FOREIGN KEY (`stall_id`) REFERENCES `stall` (`stall_id`) ON DELETE SET NULL,
ADD CONSTRAINT `fk_stallholder_created_by` FOREIGN KEY (`created_by_manager`) REFERENCES `branch_manager` (`branch_manager_id`) ON DELETE SET NULL;

-- ================================
-- 3. Insert Default Document Types
-- ================================

INSERT IGNORE INTO `document_types` (`document_name`, `description`, `is_system_default`) VALUES
('Business Permit', 'Valid business permit from local government unit', 1),
('Sanitary Permit', 'Health department sanitary permit for food-related businesses', 1),
('Fire Safety Certificate', 'Fire department safety certificate', 1),
('Cedula', 'Community tax certificate (Cedula)', 1),
('Valid ID', 'Government-issued identification document', 1),
('Barangay Clearance', 'Certificate of good moral character from barangay', 1),
('Police Clearance', 'National police clearance certificate', 1),
('Tax Identification Number (TIN)', 'Bureau of Internal Revenue TIN certificate', 1),
('SSS/PhilHealth/Pag-IBIG', 'Social security and health insurance documents', 0),
('Health Certificate', 'Medical certificate from DOH-accredited physician', 0),
('Food Handler Certificate', 'Certificate for food handling (for food vendors)', 0),
('Contract/Lease Agreement', 'Signed lease or rental agreement', 0),
('Proof of Residence', 'Utility bill or other proof of current address', 0),
('Bank Certificate', 'Certificate of bank deposit or financial capacity', 0),
('Product Registration', 'DTI or FDA registration for specific products', 0);

-- ================================
-- 4. Stored Procedures for Document Management
-- ================================

DELIMITER $$

-- Get document requirements for a specific branch
CREATE PROCEDURE `getBranchDocumentRequirements`(
    IN `p_branch_id` INT
)
BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        dt.document_type_id,
        dt.document_name,
        dt.description,
        bdr.is_required,
        bdr.instructions,
        bdr.created_at,
        CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    LEFT JOIN branch_manager bm ON bdr.created_by_manager = bm.branch_manager_id
    WHERE bdr.branch_id = p_branch_id
    ORDER BY dt.document_name;
END$$

-- Add/Update document requirement for a branch
CREATE PROCEDURE `setBranchDocumentRequirement`(
    IN `p_branch_id` INT,
    IN `p_document_type_id` INT,
    IN `p_is_required` TINYINT,
    IN `p_instructions` TEXT,
    IN `p_manager_id` INT
)
BEGIN
    INSERT INTO branch_document_requirements 
    (branch_id, document_type_id, is_required, instructions, created_by_manager)
    VALUES (p_branch_id, p_document_type_id, p_is_required, p_instructions, p_manager_id)
    ON DUPLICATE KEY UPDATE
        is_required = VALUES(is_required),
        instructions = VALUES(instructions),
        updated_at = CURRENT_TIMESTAMP;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Remove document requirement for a branch
CREATE PROCEDURE `removeBranchDocumentRequirement`(
    IN `p_branch_id` INT,
    IN `p_document_type_id` INT
)
BEGIN
    DELETE FROM branch_document_requirements 
    WHERE branch_id = p_branch_id AND document_type_id = p_document_type_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

-- Get all available document types
CREATE PROCEDURE `getAllDocumentTypes`()
BEGIN
    SELECT 
        document_type_id,
        document_name,
        description,
        is_system_default,
        created_at
    FROM document_types
    ORDER BY document_name;
END$$

-- ================================
-- 5. Enhanced Stallholder Stored Procedures
-- ================================

-- Get all stallholders with detailed information
CREATE PROCEDURE `getAllStallholdersDetailed`(
    IN `p_branch_id` INT
)
BEGIN
    IF p_branch_id IS NULL THEN
        SELECT 
            sh.stallholder_id,
            sh.applicant_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.email,
            sh.address,
            sh.business_name,
            sh.business_type,
            sh.branch_id,
            b.branch_name,
            sh.stall_id,
            s.stall_no,
            s.stall_location,
            sh.contract_start_date,
            sh.contract_end_date,
            sh.contract_status,
            sh.lease_amount,
            sh.monthly_rent,
            sh.payment_status,
            sh.last_payment_date,
            sh.compliance_status,
            sh.last_violation_date,
            sh.notes,
            sh.date_created,
            sh.updated_at,
            CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name
        FROM stallholder sh
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch_manager bm ON sh.created_by_manager = bm.branch_manager_id
        ORDER BY sh.date_created DESC;
    ELSE
        SELECT 
            sh.stallholder_id,
            sh.applicant_id,
            sh.stallholder_name,
            sh.contact_number,
            sh.email,
            sh.address,
            sh.business_name,
            sh.business_type,
            sh.branch_id,
            b.branch_name,
            sh.stall_id,
            s.stall_no,
            s.stall_location,
            sh.contract_start_date,
            sh.contract_end_date,
            sh.contract_status,
            sh.lease_amount,
            sh.monthly_rent,
            sh.payment_status,
            sh.last_payment_date,
            sh.compliance_status,
            sh.last_violation_date,
            sh.notes,
            sh.date_created,
            sh.updated_at,
            CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name
        FROM stallholder sh
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        LEFT JOIN stall s ON sh.stall_id = s.stall_id
        LEFT JOIN branch_manager bm ON sh.created_by_manager = bm.branch_manager_id
        WHERE sh.branch_id = p_branch_id
        ORDER BY sh.date_created DESC;
    END IF;
END$$

-- Get stallholder by ID with all details
CREATE PROCEDURE `getStallholderById`(
    IN `p_stallholder_id` INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.applicant_id,
        sh.stallholder_name,
        sh.contact_number,
        sh.email,
        sh.address,
        sh.business_name,
        sh.business_type,
        sh.branch_id,
        b.branch_name,
        sh.stall_id,
        s.stall_no,
        s.stall_location,
        sh.contract_start_date,
        sh.contract_end_date,
        sh.contract_status,
        sh.lease_amount,
        sh.monthly_rent,
        sh.payment_status,
        sh.last_payment_date,
        sh.compliance_status,
        sh.last_violation_date,
        sh.notes,
        sh.date_created,
        sh.updated_at,
        CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name,
        -- Applicant details
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment
    FROM stallholder sh
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    LEFT JOIN stall s ON sh.stall_id = s.stall_id
    LEFT JOIN branch_manager bm ON sh.created_by_manager = bm.branch_manager_id
    LEFT JOIN applicant a ON sh.applicant_id = a.applicant_id
    WHERE sh.stallholder_id = p_stallholder_id;
END$$

-- Create new stallholder
CREATE PROCEDURE `createStallholder`(
    IN `p_applicant_id` INT,
    IN `p_stallholder_name` VARCHAR(150),
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(255),
    IN `p_address` TEXT,
    IN `p_business_name` VARCHAR(255),
    IN `p_business_type` VARCHAR(100),
    IN `p_branch_id` INT,
    IN `p_stall_id` INT,
    IN `p_contract_start_date` DATE,
    IN `p_contract_end_date` DATE,
    IN `p_lease_amount` DECIMAL(10,2),
    IN `p_monthly_rent` DECIMAL(10,2),
    IN `p_notes` TEXT,
    IN `p_created_by_manager` INT
)
BEGIN
    DECLARE new_stallholder_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    INSERT INTO stallholder (
        applicant_id, stallholder_name, contact_number, email, address,
        business_name, business_type, branch_id, stall_id,
        contract_start_date, contract_end_date, contract_status,
        lease_amount, monthly_rent, payment_status,
        notes, created_by_manager
    ) VALUES (
        p_applicant_id, p_stallholder_name, p_contact_number, p_email, p_address,
        p_business_name, p_business_type, p_branch_id, p_stall_id,
        p_contract_start_date, p_contract_end_date, 'Active',
        p_lease_amount, p_monthly_rent, 'current',
        p_notes, p_created_by_manager
    );
    
    SET new_stallholder_id = LAST_INSERT_ID();
    
    -- Update stall status to occupied if stall is assigned
    IF p_stall_id IS NOT NULL THEN
        UPDATE stall 
        SET status = 'Occupied', is_available = 0 
        WHERE stall_id = p_stall_id;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder created successfully' AS message, new_stallholder_id as stallholder_id;
END$$

-- Update stallholder information
CREATE PROCEDURE `updateStallholder`(
    IN `p_stallholder_id` INT,
    IN `p_stallholder_name` VARCHAR(150),
    IN `p_contact_number` VARCHAR(20),
    IN `p_email` VARCHAR(255),
    IN `p_address` TEXT,
    IN `p_business_name` VARCHAR(255),
    IN `p_business_type` VARCHAR(100),
    IN `p_stall_id` INT,
    IN `p_contract_start_date` DATE,
    IN `p_contract_end_date` DATE,
    IN `p_contract_status` ENUM('Active','Expired','Terminated'),
    IN `p_lease_amount` DECIMAL(10,2),
    IN `p_monthly_rent` DECIMAL(10,2),
    IN `p_payment_status` ENUM('current','overdue','grace_period'),
    IN `p_notes` TEXT
)
BEGIN
    DECLARE old_stall_id INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Get current stall_id
    SELECT stall_id INTO old_stall_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
    
    -- Update stallholder
    UPDATE stallholder SET
        stallholder_name = COALESCE(p_stallholder_name, stallholder_name),
        contact_number = COALESCE(p_contact_number, contact_number),
        email = COALESCE(p_email, email),
        address = COALESCE(p_address, address),
        business_name = COALESCE(p_business_name, business_name),
        business_type = COALESCE(p_business_type, business_type),
        stall_id = p_stall_id,
        contract_start_date = COALESCE(p_contract_start_date, contract_start_date),
        contract_end_date = COALESCE(p_contract_end_date, contract_end_date),
        contract_status = COALESCE(p_contract_status, contract_status),
        lease_amount = COALESCE(p_lease_amount, lease_amount),
        monthly_rent = COALESCE(p_monthly_rent, monthly_rent),
        payment_status = COALESCE(p_payment_status, payment_status),
        notes = COALESCE(p_notes, notes),
        updated_at = CURRENT_TIMESTAMP
    WHERE stallholder_id = p_stallholder_id;
    
    -- Update old stall availability
    IF old_stall_id IS NOT NULL AND old_stall_id != p_stall_id THEN
        UPDATE stall 
        SET status = 'Active', is_available = 1 
        WHERE stall_id = old_stall_id;
    END IF;
    
    -- Update new stall status
    IF p_stall_id IS NOT NULL AND p_stall_id != old_stall_id THEN
        UPDATE stall 
        SET status = 'Occupied', is_available = 0 
        WHERE stall_id = p_stall_id;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder updated successfully' AS message, ROW_COUNT() as affected_rows;
END$$

-- Delete/Deactivate stallholder
CREATE PROCEDURE `deleteStallholder`(
    IN `p_stallholder_id` INT
)
BEGIN
    DECLARE stall_to_free INT DEFAULT NULL;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        GET DIAGNOSTICS CONDITION 1 @sqlstate = RETURNED_SQLSTATE, @errno = MYSQL_ERRNO, @text = MESSAGE_TEXT;
        SELECT 0 as success, CONCAT('Error: ', @text) AS message, @errno AS error_code;
    END;
    
    START TRANSACTION;
    
    -- Get stall_id to free up
    SELECT stall_id INTO stall_to_free FROM stallholder WHERE stallholder_id = p_stallholder_id;
    
    -- Update contract status to terminated instead of deleting
    UPDATE stallholder 
    SET contract_status = 'Terminated', updated_at = CURRENT_TIMESTAMP
    WHERE stallholder_id = p_stallholder_id;
    
    -- Free up the stall
    IF stall_to_free IS NOT NULL THEN
        UPDATE stall 
        SET status = 'Active', is_available = 1 
        WHERE stall_id = stall_to_free;
    END IF;
    
    COMMIT;
    
    SELECT 1 as success, 'Stallholder contract terminated successfully' AS message, ROW_COUNT() as affected_rows;
END$$

DELIMITER ;

-- ================================
-- 6. Insert Sample Data
-- ================================

-- Insert some sample document requirements for existing branches
INSERT IGNORE INTO `branch_document_requirements` (`branch_id`, `document_type_id`, `is_required`, `instructions`, `created_by_manager`)
SELECT 
    b.branch_id,
    dt.document_type_id,
    CASE 
        WHEN dt.document_name IN ('Business Permit', 'Valid ID', 'Cedula') THEN 1
        WHEN dt.document_name IN ('Sanitary Permit') AND dt.document_type_id % 3 = 0 THEN 1
        ELSE 0
    END as is_required,
    CASE 
        WHEN dt.document_name = 'Business Permit' THEN 'Must be current and valid. Renewal required annually.'
        WHEN dt.document_name = 'Sanitary Permit' THEN 'Required for all food-related businesses.'
        WHEN dt.document_name = 'Valid ID' THEN 'Any government-issued photo ID accepted.'
        ELSE NULL
    END as instructions,
    bm.branch_manager_id
FROM branch b
CROSS JOIN document_types dt
INNER JOIN branch_manager bm ON b.branch_id = bm.branch_id
WHERE dt.document_type_id IN (1, 2, 4, 5) AND bm.status = 'Active';

-- Update existing stallholder records with additional information
UPDATE stallholder sh
LEFT JOIN applicant a ON sh.applicant_id = a.applicant_id
SET 
    sh.contact_number = COALESCE(sh.contact_number, a.applicant_contact_number),
    sh.email = COALESCE(sh.email, 'stallholder@example.com'),
    sh.business_name = COALESCE(sh.business_name, CONCAT(sh.stallholder_name, ' Business')),
    sh.business_type = COALESCE(sh.business_type, 'General Merchandise'),
    sh.monthly_rent = COALESCE(sh.monthly_rent, sh.lease_amount / 12),
    sh.payment_status = COALESCE(sh.payment_status, 'current'),
    sh.updated_at = CURRENT_TIMESTAMP
WHERE sh.contact_number IS NULL OR sh.business_name IS NULL;
