-- =====================================================
-- RESTORE SCRIPT - RESTORE BACKED UP PROCEDURES
-- Generated: January 13, 2026
-- Purpose: Restore procedures from backup if needed
-- =====================================================
--
-- HOW TO USE:
-- 1. This script retrieves procedure definitions from backup
-- 2. You can restore ALL or SPECIFIC procedures
-- =====================================================

-- =====================================================
-- VIEW ALL BACKED UP PROCEDURES
-- =====================================================

SELECT 
    id,
    procedure_name,
    backup_date,
    backup_reason,
    CASE 
        WHEN procedure_definition IS NOT NULL THEN 'Definition Available'
        ELSE 'No Definition (needs manual restore)'
    END as status
FROM procedure_backup
ORDER BY procedure_name;

-- =====================================================
-- TO RESTORE A SPECIFIC PROCEDURE:
-- =====================================================
-- 
-- 1. Find the procedure you want to restore:
--    SELECT procedure_name, procedure_definition 
--    FROM procedure_backup 
--    WHERE procedure_name = 'your_procedure_name';
--
-- 2. Copy the procedure_definition and execute it
--
-- OR use the dynamic restore below:

-- =====================================================
-- RESTORE ALL AUCTION PROCEDURES
-- =====================================================
-- Uncomment the following block to restore all auction procedures:

/*
-- Get all auction procedure definitions
SELECT 
    CONCAT(
        'DELIMITER //\n',
        'CREATE PROCEDURE ', procedure_name, '\n',
        'BEGIN\n',
        IFNULL(procedure_definition, '-- Definition not available, manual restore needed'),
        '\nEND //\n',
        'DELIMITER ;'
    ) as restore_script
FROM procedure_backup
WHERE procedure_name LIKE '%auction%' OR procedure_name LIKE '%Auction%'
ORDER BY procedure_name;
*/

-- =====================================================
-- RESTORE ALL RAFFLE PROCEDURES
-- =====================================================
-- Uncomment the following block to restore all raffle procedures:

/*
-- Get all raffle procedure definitions
SELECT 
    CONCAT(
        'DELIMITER //\n',
        'CREATE PROCEDURE ', procedure_name, '\n',
        'BEGIN\n',
        IFNULL(procedure_definition, '-- Definition not available, manual restore needed'),
        '\nEND //\n',
        'DELIMITER ;'
    ) as restore_script
FROM procedure_backup
WHERE procedure_name LIKE '%raffle%' OR procedure_name LIKE '%Raffle%'
ORDER BY procedure_name;
*/

-- =====================================================
-- RESTORE ALL PROCEDURES (FULL RESTORE)
-- =====================================================
-- WARNING: Only use this if you want to restore everything

/*
SELECT 
    procedure_name,
    procedure_definition
FROM procedure_backup
WHERE procedure_definition IS NOT NULL
ORDER BY procedure_name;
*/

-- =====================================================
-- CHECK BACKUP STATUS
-- =====================================================

SELECT 
    'Total backed up procedures:' as info,
    COUNT(*) as count
FROM procedure_backup;

SELECT 
    'Procedures with definitions:' as info,
    COUNT(*) as count
FROM procedure_backup
WHERE procedure_definition IS NOT NULL;

SELECT 
    'Procedures without definitions (need manual restore):' as info,
    COUNT(*) as count
FROM procedure_backup
WHERE procedure_definition IS NULL;

-- =====================================================
-- MANUAL RESTORE HELPER
-- =====================================================
-- If procedure_definition is NULL, you'll need to restore from:
-- 1. Your SQL migration files in database/migrations/
-- 2. Your original database dump file (naga_stall_digitalocean.sql)
-- 3. Git history of your SQL files

SELECT '=======================================' as '';
SELECT 'RESTORE GUIDE' as message;
SELECT 'Use procedure_backup table to restore specific procedures' as step1;
SELECT 'Auction/Raffle procedures can be restored when features are enabled' as step2;
SELECT '=======================================' as '';
