-- Migration: 203_add_base_rate_to_stall.sql
-- Description: Add base_rate column to stall table for rental calculation
-- Formula: monthly_rent = base_rate * 1.5 (base doubled then 25% discount for early payment)
-- Created: 2025-12-22

-- Add base_rate column to stall table
ALTER TABLE `stall` 
ADD COLUMN `base_rate` decimal(10,2) DEFAULT NULL AFTER `rental_price`,
ADD COLUMN `area_sqm` decimal(8,2) DEFAULT NULL AFTER `size`,
ADD COLUMN `rate_per_sqm` decimal(10,2) DEFAULT NULL AFTER `base_rate`;

-- Update existing stalls: Calculate base_rate from rental_price
-- base_rate = rental_price / 1.5
UPDATE `stall` 
SET `base_rate` = ROUND(`rental_price` / 1.5, 2)
WHERE `rental_price` IS NOT NULL AND `base_rate` IS NULL;

-- Update rate_per_sqm where we can parse area from size (e.g., "3x4")
-- For now, set to NULL - will be calculated when area is available
