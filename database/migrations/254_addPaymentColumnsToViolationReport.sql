-- Migration: 254_addPaymentColumnsToViolationReport.sql
-- Description: Add payment columns to violation_report table
-- Date: December 28, 2025

-- Add payment columns to violation_report table
ALTER TABLE `violation_report`
ADD COLUMN `payment_date` DATETIME NULL AFTER `penalty_id`,
ADD COLUMN `payment_reference` VARCHAR(100) NULL AFTER `payment_date`,
ADD COLUMN `paid_amount` DECIMAL(10,2) NULL AFTER `payment_reference`,
ADD COLUMN `collected_by` VARCHAR(255) NULL AFTER `paid_amount`,
ADD COLUMN `receipt_number` VARCHAR(100) NULL AFTER `collected_by`;
