-- ========================================
-- DOCUMENT TYPES SYSTEM SETUP
-- ========================================
-- This file sets up the document types system properly
-- All document types are now stored in the database, not hardcoded

-- Step 1: Drop existing document_types table if it exists
DROP TABLE IF EXISTS document_types;

-- Step 2: Create document_types table with proper structure
CREATE TABLE document_types (
  document_type_id INT(11) NOT NULL AUTO_INCREMENT,
  type_name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT DEFAULT NULL,
  category VARCHAR(50) DEFAULT 'General',
  is_system_default TINYINT(1) DEFAULT 0 COMMENT 'System defaults cannot be deleted',
  display_order INT DEFAULT 0,
  status ENUM('Active','Inactive') DEFAULT 'Active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (document_type_id),
  KEY idx_status (status),
  KEY idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Insert all standard document types from the UI
INSERT INTO document_types (type_name, description, category, is_system_default, display_order, status) VALUES
('Barangay Clearance', 'Clearance from local barangay', 'Legal', 1, 1, 'Active'),
('Business Permit', 'DTI registration or business permit', 'Business', 1, 2, 'Active'),
('Contract', 'Signed stall rental contract', 'Legal', 1, 3, 'Active'),
('Health Certificate', 'Health certificate from local health office', 'Health & Safety', 1, 4, 'Active'),
('Photo', 'Recent 2x2 ID photo', 'Identification', 1, 5, 'Active'),
('Police Clearance', 'NBI or Police clearance', 'Legal', 1, 6, 'Active'),
('Proof of Address', 'Utility bill or lease agreement', 'Identification', 1, 7, 'Active'),
('Tax Clearance', 'BIR tax clearance certificate', 'Financial', 1, 8, 'Active'),
('Fire Safety Certificate', 'Fire safety inspection certificate', 'Health & Safety', 1, 9, 'Active'),
('Sanitary Permit', 'Sanitary permit from local health office', 'Health & Safety', 1, 10, 'Active'),
('Valid ID', 'Government-issued ID (passport, driver\'s license, etc.)', 'Identification', 1, 11, 'Active'),
('Proof of Income', 'Latest payslip or income tax return', 'Financial', 1, 12, 'Active'),
('Bank Statement', 'Latest bank statement (last 3 months)', 'Financial', 1, 13, 'Active'),
('Certificate of Registration', 'SEC/DTI certificate of registration', 'Business', 1, 14, 'Active'),
('Mayor\'s Permit', 'Business permit from city/municipal office', 'Business', 1, 15, 'Active');

-- Step 4: Update branch_document_requirements table to use document_type_id
-- First, backup existing data
CREATE TABLE IF NOT EXISTS branch_document_requirements_backup AS 
SELECT * FROM branch_document_requirements;

-- Drop the old table
DROP TABLE IF EXISTS branch_document_requirements;

-- Create new table with proper foreign key to document_types
CREATE TABLE branch_document_requirements (
  requirement_id INT(11) NOT NULL AUTO_INCREMENT,
  branch_id INT(11) NOT NULL,
  document_type_id INT(11) NOT NULL,
  is_required TINYINT(1) NOT NULL DEFAULT 1,
  instructions TEXT DEFAULT NULL COMMENT 'Special instructions for this document requirement',
  created_by_business_manager INT(11) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (requirement_id),
  KEY idx_branch_id (branch_id),
  KEY idx_document_type (document_type_id),
  UNIQUE KEY unique_branch_document (branch_id, document_type_id),
  CONSTRAINT fk_branch_doc_req_branch FOREIGN KEY (branch_id) REFERENCES branch(branch_id) ON DELETE CASCADE,
  CONSTRAINT fk_branch_doc_req_type FOREIGN KEY (document_type_id) REFERENCES document_types(document_type_id) ON DELETE CASCADE,
  CONSTRAINT fk_branch_doc_req_creator FOREIGN KEY (created_by_business_manager) REFERENCES business_manager(business_manager_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 5: Migrate old data if exists
-- Match old document_name to new document_type_id
INSERT IGNORE INTO branch_document_requirements (branch_id, document_type_id, is_required, instructions, created_by_business_manager, created_at)
SELECT 
  b.branch_id,
  dt.document_type_id,
  COALESCE(b.is_required, 1),
  b.description,
  b.created_by,
  b.created_at
FROM branch_document_requirements_backup b
INNER JOIN document_types dt ON dt.type_name = b.document_name
WHERE dt.document_type_id IS NOT NULL;

-- Step 6: Create view for easy querying
CREATE OR REPLACE VIEW v_branch_document_requirements AS
SELECT 
  bdr.requirement_id,
  bdr.branch_id,
  b.branch_name,
  bdr.document_type_id,
  dt.type_name,
  dt.description,
  dt.category,
  bdr.is_required,
  bdr.instructions,
  bdr.created_by_business_manager,
  bm.full_name as created_by_name,
  bdr.created_at,
  bdr.updated_at
FROM branch_document_requirements bdr
INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
INNER JOIN branch b ON bdr.branch_id = b.branch_id
LEFT JOIN business_manager bm ON bdr.created_by_business_manager = bm.business_manager_id
WHERE dt.status = 'Active'
ORDER BY b.branch_name, dt.display_order;

-- Step 7: Show summary
SELECT 
  'Document Types Created' as Action,
  COUNT(*) as Count
FROM document_types;

SELECT 
  'Document Requirements Migrated' as Action,
  COUNT(*) as Count
FROM branch_document_requirements;

SELECT 
  'System Setup' as Status,
  'Complete' as Result,
  NOW() as Timestamp;
