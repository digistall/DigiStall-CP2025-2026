-- =====================================================
-- RESET APPLICANT DATA - Start IDs from 1
-- Run this in phpMyAdmin or MySQL Workbench
-- =====================================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='TRADITIONAL';

-- Drop triggers that call ResetAutoIncrement (they use dynamic SQL which causes errors)
DROP TRIGGER IF EXISTS trg_application_reset_auto;
DROP TRIGGER IF EXISTS trg_applicant_reset_auto;
DROP TRIGGER IF EXISTS trg_stallholder_reset_auto;
DROP TRIGGER IF EXISTS trg_credential_reset_auto;
DROP TRIGGER IF EXISTS trg_applicant_documents_reset_auto;
DROP TRIGGER IF EXISTS trg_spouse_reset_auto;
DROP TRIGGER IF EXISTS trg_business_information_reset_auto;

-- Use DELETE instead of TRUNCATE to avoid foreign key constraint issues
-- Clear tables that reference application
DELETE FROM auction_bids WHERE 1=1;
DELETE FROM auction_result WHERE 1=1;

-- Clear tables that reference stallholder
DELETE FROM violation_report WHERE 1=1;

-- Clear tables that reference applicant (auction/raffle)
DELETE FROM raffle_participants WHERE 1=1;
DELETE FROM raffle_result WHERE 1=1;

-- Clear related tables (tables that reference applicant)
DELETE FROM credential WHERE 1=1;
DELETE FROM spouse WHERE 1=1;
DELETE FROM business_information WHERE 1=1;
DELETE FROM application WHERE 1=1;
DELETE FROM stallholder WHERE 1=1;
DELETE FROM applicant_documents WHERE 1=1;

-- Clear applicant table
DELETE FROM applicant WHERE 1=1;

-- Reset AUTO_INCREMENT to 1
ALTER TABLE applicant AUTO_INCREMENT = 1;
ALTER TABLE stallholder AUTO_INCREMENT = 1;
ALTER TABLE application AUTO_INCREMENT = 1;
ALTER TABLE credential AUTO_INCREMENT = 1;
ALTER TABLE applicant_documents AUTO_INCREMENT = 1;
ALTER TABLE spouse AUTO_INCREMENT = 1;
ALTER TABLE business_information AUTO_INCREMENT = 1;

-- Recreate triggers (simple version without ResetAutoIncrement procedure)
DELIMITER $$
CREATE TRIGGER trg_application_reset_auto AFTER DELETE ON application FOR EACH ROW 
BEGIN
    DECLARE max_id INT;
    SELECT IFNULL(MAX(application_id), 0) INTO max_id FROM application;
    SET @alter_sql = CONCAT('ALTER TABLE application AUTO_INCREMENT = ', max_id + 1);
END$$

CREATE TRIGGER trg_applicant_reset_auto AFTER DELETE ON applicant FOR EACH ROW 
BEGIN
    DECLARE max_id INT;
    SELECT IFNULL(MAX(applicant_id), 0) INTO max_id FROM applicant;
    SET @alter_sql = CONCAT('ALTER TABLE applicant AUTO_INCREMENT = ', max_id + 1);
END$$

CREATE TRIGGER trg_stallholder_reset_auto AFTER DELETE ON stallholder FOR EACH ROW 
BEGIN
    DECLARE max_id INT;
    SELECT IFNULL(MAX(stallholder_id), 0) INTO max_id FROM stallholder;
    SET @alter_sql = CONCAT('ALTER TABLE stallholder AUTO_INCREMENT = ', max_id + 1);
END$$
DELIMITER ;

-- Re-enable foreign key checks
SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS = 1;

-- Verify reset
SELECT '✅ Tables reset successfully!' as Status;
SELECT 'applicant' as TableName, COUNT(*) as RowCount FROM applicant
UNION ALL SELECT 'stallholder', COUNT(*) FROM stallholder
UNION ALL SELECT 'credential', COUNT(*) FROM credential
UNION ALL SELECT 'application', COUNT(*) FROM application
UNION ALL SELECT 'auction_bids', COUNT(*) FROM auction_bids
UNION ALL SELECT 'violation_report', COUNT(*) FROM violation_report;
