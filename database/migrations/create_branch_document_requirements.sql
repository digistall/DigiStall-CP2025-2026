-- Create table for branch-specific document requirements
-- This allows branch managers to define their own required documents for stallholders

CREATE TABLE IF NOT EXISTS `branch_document_requirements` (
  `document_requirement_id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) NOT NULL,
  `document_name` varchar(255) NOT NULL,
  `description` text,
  `is_required` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` int(11) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`document_requirement_id`),
  KEY `idx_branch_id` (`branch_id`),
  KEY `idx_created_by` (`created_by`),
  UNIQUE KEY `unique_branch_document` (`branch_id`, `document_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints (uncomment if tables exist)
-- ALTER TABLE `branch_document_requirements` 
--   ADD CONSTRAINT `fk_branch_requirements_branch` 
--   FOREIGN KEY (`branch_id`) REFERENCES `branches` (`branch_id`) ON DELETE CASCADE,
--   ADD CONSTRAINT `fk_branch_requirements_creator` 
--   FOREIGN KEY (`created_by`) REFERENCES `users` (`user_id`) ON DELETE CASCADE;

-- Insert some sample data for testing
INSERT IGNORE INTO `branch_document_requirements` 
(`branch_id`, `document_name`, `description`, `is_required`, `created_by`) 
VALUES
(1, 'Business Registration Certificate', 'Official business registration from DTI or SEC', 1, 1),
(1, 'Valid ID', 'Government-issued photo identification', 1, 1),
(1, 'Barangay Clearance', 'Clearance from local barangay', 1, 1),
(2, 'Business Permit', 'Local business operating permit', 1, 2),
(2, 'Tax Identification Number', 'BIR TIN certificate', 1, 2),
(2, 'Health Certificate', 'DOH health certificate for food handlers', 0, 2);