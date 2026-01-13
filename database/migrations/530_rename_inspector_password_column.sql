-- =====================================================
-- Migration: Rename inspector password column to password_hash
-- Purpose: Standardize password column naming across inspector and collector tables
-- Date: 2026-01-11
-- =====================================================

USE naga_stall;

-- Rename password column to password_hash in inspector table
ALTER TABLE inspector 
CHANGE COLUMN password password_hash VARCHAR(255) NOT NULL;

-- Verify the change
SELECT 'Inspector password column renamed to password_hash successfully' as status;
