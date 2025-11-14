-- ========================================
-- PAYMENT SYSTEM ENHANCEMENT
-- Migration 021: Enhanced Payment Management (Clean Version)
-- Date: November 13, 2025
-- ========================================

-- Create payments table to track all payment transactions
CREATE TABLE IF NOT EXISTS `payments` (
  `payment_id` int(11) NOT NULL AUTO_INCREMENT,
  `stallholder_id` int(11) NOT NULL,
  `payment_method` enum('onsite','online','bank_transfer','check') NOT NULL DEFAULT 'onsite',
  `amount` decimal(10,2) NOT NULL,
  `payment_date` date NOT NULL,
  `payment_time` time DEFAULT NULL,
  `payment_for_month` varchar(7) DEFAULT NULL COMMENT 'YYYY-MM format for which month the payment is for',
  `payment_type` enum('rental','penalty','deposit','maintenance','other') DEFAULT 'rental',
  `reference_number` varchar(100) DEFAULT NULL COMMENT 'Receipt number, transaction ID, check number, etc.',
  `collected_by` varchar(100) DEFAULT NULL COMMENT 'Who collected the payment (for onsite payments)',
  `payment_status` enum('pending','completed','failed','cancelled') DEFAULT 'completed',
  `notes` text DEFAULT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `created_by` int(11) DEFAULT NULL COMMENT 'Branch manager or employee who recorded the payment',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`payment_id`),
  KEY `idx_stallholder_payment` (`stallholder_id`, `payment_date`),
  KEY `idx_payment_method` (`payment_method`),
  KEY `idx_payment_date` (`payment_date`),
  KEY `idx_payment_for_month` (`payment_for_month`),
  KEY `idx_branch_payments` (`branch_id`, `payment_date`),
  CONSTRAINT `fk_payment_stallholder` FOREIGN KEY (`stallholder_id`) REFERENCES `stallholder` (`stallholder_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_payment_branch` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Add employee table if it doesn't exist for tracking who made the payment entry
CREATE TABLE IF NOT EXISTS `employee` (
  `employee_id` int(11) NOT NULL AUTO_INCREMENT,
  `branch_id` int(11) NOT NULL,
  `employee_username` varchar(50) NOT NULL UNIQUE,
  `employee_password_hash` varchar(255) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `contact_number` varchar(20) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `permissions` JSON DEFAULT NULL COMMENT 'Employee permissions like stallholder, payment, etc.',
  `status` enum('Active','Inactive') DEFAULT 'Active',
  `created_by_manager` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`employee_id`),
  KEY `branch_id` (`branch_id`),
  KEY `fk_employee_created_by` (`created_by_manager`),
  CONSTRAINT `employee_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branch` (`branch_id`) ON DELETE CASCADE,
  CONSTRAINT `fk_employee_created_by` FOREIGN KEY (`created_by_manager`) REFERENCES `branch_manager` (`branch_manager_id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Insert sample employee data for testing
INSERT IGNORE INTO employee (
    branch_id, employee_username, employee_password_hash, first_name, last_name,
    email, contact_number, position, permissions, created_by_manager
) VALUES 
(1, 'emp1_branch1', '$2b$10$rGWJJ6V7yU4hKLJLYnGsXOAQZcrzYOhQM8waqM6H9M6M9M6M9M6M9M', 
 'Juan', 'Dela Cruz', 'juan.delacruz@nagastall.com', '09171234567', 'Payment Officer',
 '["payment", "stallholder"]', 1),
(2, 'emp1_branch2', '$2b$10$rGWJJ6V7yU4hKLJLYnGsXOAQZcrzYOhQM8waqM6H9M6M9M6M9M6M9M', 
 'Maria', 'Santos', 'maria.santos@nagastall.com', '09181234567', 'Administrative Assistant',
 '["payment"]', 2),
(3, 'emp1_branch3', '$2b$10$rGWJJ6V7yU4hKLJLYnGsXOAQZcrzYOhQM8waqM6H9M6M9M6M9M6M9M', 
 'Jose', 'Rizal', 'jose.rizal@nagastall.com', '09191234567', 'Finance Officer',
 '["payment", "stallholder", "reports"]', 3);

-- Insert sample payment data for existing stallholders
INSERT IGNORE INTO payments (
    stallholder_id, payment_method, amount, payment_date, payment_time, payment_for_month,
    payment_type, reference_number, collected_by, notes, branch_id, created_by
) VALUES 
-- Onsite payments for Branch 1 stallholders
(13, 'onsite', 2500.00, '2025-11-01', '09:30:00', '2025-11', 'rental', 'RCP-20251101-001', 'Juan Dela Cruz', 'Monthly rental payment', 1, 1),
(14, 'onsite', 3000.00, '2025-11-02', '10:15:00', '2025-11', 'rental', 'RCP-20251102-001', 'Juan Dela Cruz', 'Monthly rental payment', 1, 1),
(15, 'onsite', 3500.00, '2025-11-03', '11:00:00', '2025-11', 'rental', 'RCP-20251103-001', 'Juan Dela Cruz', 'Monthly rental payment', 1, 1),
(16, 'onsite', 2800.00, '2025-11-04', '14:20:00', '2025-11', 'rental', 'RCP-20251104-001', 'Juan Dela Cruz', 'Monthly rental payment', 1, 1),

-- Online payments for Branch 1 stallholders
(17, 'online', 4000.00, '2025-11-05', '08:45:00', '2025-11', 'rental', 'TXN-20251105-001', NULL, 'Online bank transfer', 1, NULL),
(18, 'online', 3200.00, '2025-11-06', '16:30:00', '2025-11', 'rental', 'TXN-20251106-001', NULL, 'Online payment via GCash', 1, NULL),

-- Onsite payments for Branch 2 stallholders
(19, 'onsite', 2200.00, '2025-11-07', '09:00:00', '2025-11', 'rental', 'RCP-20251107-001', 'Maria Santos', 'Monthly rental payment', 2, 2),
(20, 'onsite', 2700.00, '2025-11-08', '13:15:00', '2025-11', 'rental', 'RCP-20251108-001', 'Maria Santos', 'Monthly rental payment', 2, 2),

-- Online payments for Branch 2 stallholders  
(21, 'online', 3100.00, '2025-11-09', '10:20:00', '2025-11', 'rental', 'TXN-20251109-001', NULL, 'Online payment via PayMaya', 2, NULL),
(22, 'online', 2900.00, '2025-11-10', '15:45:00', '2025-11', 'rental', 'TXN-20251110-001', NULL, 'Bank transfer', 2, NULL),

-- Mixed payments for Branch 3 stallholders
(23, 'onsite', 4200.00, '2025-11-11', '11:30:00', '2025-11', 'rental', 'RCP-20251111-001', 'Jose Rizal', 'Monthly rental payment', 3, 3),
(24, 'bank_transfer', 3800.00, '2025-11-12', '14:00:00', '2025-11', 'rental', 'BT-20251112-001', NULL, 'Bank transfer payment', 3, 3),

-- Previous month payments (October 2025)
(13, 'onsite', 2500.00, '2025-10-15', '10:00:00', '2025-10', 'rental', 'RCP-20251015-001', 'Juan Dela Cruz', 'October rental payment', 1, 1),
(14, 'online', 3000.00, '2025-10-20', '09:30:00', '2025-10', 'rental', 'TXN-20251020-001', NULL, 'October online payment', 1, NULL),
(19, 'onsite', 2200.00, '2025-10-25', '11:15:00', '2025-10', 'rental', 'RCP-20251025-001', 'Maria Santos', 'October rental payment', 2, 2);

-- Record migration execution
INSERT IGNORE INTO migrations (migration_name, version) 
VALUES ('021_payment_system_enhancement', '2.1.0');