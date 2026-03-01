-- ===== DATABASE SCHEMA FIX SCRIPT =====
-- Adds missing columns and tables for DigiStall system
-- Run this script to fix common schema issues
-- Date: January 28, 2026

-- ===== ADD is_online COLUMN TO USER TABLES =====
-- These columns track online status for heartbeat functionality

-- business_manager table
ALTER TABLE business_manager 
ADD COLUMN IF NOT EXISTS is_online TINYINT(1) DEFAULT 0 AFTER last_login;

-- business_employee table  
ALTER TABLE business_employee 
ADD COLUMN IF NOT EXISTS is_online TINYINT(1) DEFAULT 0 AFTER last_login;

-- stall_business_owner table
ALTER TABLE stall_business_owner 
ADD COLUMN IF NOT EXISTS is_online TINYINT(1) DEFAULT 0 AFTER last_login;

-- system_administrator table
ALTER TABLE system_administrator 
ADD COLUMN IF NOT EXISTS is_online TINYINT(1) DEFAULT 0 AFTER last_login;

-- ===== CREATE PAYMENT TABLE IF NOT EXISTS =====
CREATE TABLE IF NOT EXISTS payment (
  payment_id INT AUTO_INCREMENT PRIMARY KEY,
  stallholder_id INT NOT NULL,
  stall_id INT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  payment_method ENUM('cash', 'gcash', 'bank_transfer', 'other') DEFAULT 'cash',
  payment_type ENUM('monthly_rent', 'daily_fee', 'utility', 'penalty', 'other') DEFAULT 'monthly_rent',
  reference_number VARCHAR(100),
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
  notes TEXT,
  collected_by INT,
  branch_id INT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_stallholder (stallholder_id),
  INDEX idx_stall (stall_id),
  INDEX idx_branch (branch_id),
  INDEX idx_payment_date (payment_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ===== VERIFICATION QUERIES =====
-- Run these to verify the changes were applied

SELECT 'business_manager columns:' AS info;
SHOW COLUMNS FROM business_manager LIKE 'is_online';

SELECT 'business_employee columns:' AS info;
SHOW COLUMNS FROM business_employee LIKE 'is_online';

SELECT 'stall_business_owner columns:' AS info;
SHOW COLUMNS FROM stall_business_owner LIKE 'is_online';

SELECT 'system_administrator columns:' AS info;
SHOW COLUMNS FROM system_administrator LIKE 'is_online';

SELECT 'payment table:' AS info;
SHOW TABLES LIKE 'payment';

SELECT '✅ Schema fix script completed!' AS status;
