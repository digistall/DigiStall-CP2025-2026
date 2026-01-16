-- ========================================
-- COMPLETE DATABASE RESET - RUN ALL FILES
-- ========================================
-- 
-- Execute this file in MySQL Workbench or CLI to reset the entire database
-- This will:
-- 1. Drop all existing tables, procedures, functions, events, views
-- 2. Create new clean table structure
-- 3. Create all stored procedures
-- 4. Insert initial seed data
--
-- ENCRYPTION NOTE:
-- All encryption/decryption is handled in Node.js using AES-256-GCM
-- NOT in MySQL stored procedures
--
-- Order of execution:
-- 1. CLEAN_DATABASE_SCHEMA.sql (Tables)
-- 2. STORED_PROCEDURES_PART1.sql (Inspector, Collector, Employee, Manager)
-- 3. STORED_PROCEDURES_PART2.sql (Applicant, Stallholder, Application)
-- 4. STORED_PROCEDURES_PART3.sql (Branch, Stall, Payment, Violation)
-- 5. MASTER_DATABASE_RESET.sql (Cleanup, Seed Data, Event, Views)
-- ========================================

USE naga_stall;

-- Show which database we're connected to
SELECT DATABASE() AS 'Connected to Database';

-- Source files in order (for MySQL CLI)
-- If using MySQL Workbench, run each file separately in order

-- In MySQL CLI, you would run:
-- mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < CLEAN_DATABASE_SCHEMA.sql
-- mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < STORED_PROCEDURES_PART1.sql
-- mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < STORED_PROCEDURES_PART2.sql
-- mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < STORED_PROCEDURES_PART3.sql
-- mysql -h dbaas-db-2078449-do-user-29954926-0.f.db.ondigitalocean.com -P 25060 -u doadmin -p naga_stall < MASTER_DATABASE_RESET.sql

SELECT '⚠️ INSTRUCTIONS:' AS message;
SELECT '1. Run CLEAN_DATABASE_SCHEMA.sql first' AS step1;
SELECT '2. Run STORED_PROCEDURES_PART1.sql' AS step2;
SELECT '3. Run STORED_PROCEDURES_PART2.sql' AS step3;
SELECT '4. Run STORED_PROCEDURES_PART3.sql' AS step4;
SELECT '5. Run MASTER_DATABASE_RESET.sql last' AS step5;
