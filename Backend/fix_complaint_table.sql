-- ===== FIX COMPLAINT TABLE =====
-- Drop and recreate the complaint table with proper structure

USE naga_stall;

-- Drop the old table
DROP TABLE IF EXISTS `complaint`;

-- Create the complaint table with proper structure
CREATE TABLE `complaint` (
  `complaint_id` INT AUTO_INCREMENT PRIMARY KEY,
  `complaint_type` VARCHAR(100) NOT NULL,
  `sender_name` VARCHAR(255),
  `sender_contact` VARCHAR(50),
  `sender_email` VARCHAR(255),
  `stallholder_id` INT,
  `stall_id` INT,
  `branch_id` INT,
  `subject` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `evidence` LONGBLOB,
  `status` ENUM('pending', 'in_progress', 'resolved', 'closed') DEFAULT 'pending',
  `resolution_notes` TEXT,
  `resolved_by` INT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `resolved_at` TIMESTAMP NULL,
  INDEX `idx_stallholder` (`stallholder_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_branch` (`branch_id`),
  INDEX `idx_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT '✅ Complaint table recreated successfully!' as Status;
