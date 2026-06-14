-- Migration: Improve vendor_account table structure
-- Date: 2026-06-15
-- Purpose: Add vendor_id FK, status, timestamps, and unique constraint
-- Safe to run on existing data (all new columns have defaults or allow NULL)

-- 1. Add vendor_id column with FK to vendor table
ALTER TABLE vendor_account
  ADD COLUMN vendor_id INT DEFAULT NULL AFTER vendor_account_id,
  ADD KEY idx_vendor_account_vendor_id (vendor_id),
  ADD CONSTRAINT fk_vendor_account_vendor
    FOREIGN KEY (vendor_id) REFERENCES vendor(vendor_id) ON DELETE SET NULL;

-- 2. Add status column for account activation/deactivation
ALTER TABLE vendor_account
  ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active' AFTER vendor_password_hash;

-- 3. Add timestamps and last_login
ALTER TABLE vendor_account
  ADD COLUMN last_login DATETIME DEFAULT NULL,
  ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 4. Add unique constraint on vendor_email to prevent duplicates
ALTER TABLE vendor_account
  ADD UNIQUE KEY uq_vendor_account_email (vendor_email);

-- 5. Backfill vendor_id for any existing rows by matching email
UPDATE vendor_account va
  JOIN vendor v ON LOWER(va.vendor_email) = LOWER(v.email)
  SET va.vendor_id = v.vendor_id
  WHERE va.vendor_id IS NULL;

-- Done! Now insert the test vendor account:
-- INSERT INTO vendor_account (vendor_id, vendor_email, vendor_password_hash)
-- VALUES (1, 'jovel@email.com', '$2a$10$E2cPq4FS9Jy3okAE3ztEW.Z1QZpmgJ7rzd25XdG.lLm/7329nR7wy');
