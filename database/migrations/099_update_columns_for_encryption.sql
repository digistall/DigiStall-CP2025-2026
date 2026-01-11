-- Migration 099: Update columns to support encrypted data
-- Description: Increases column sizes to accommodate encrypted data (AES-256-GCM with base64 encoding)
-- Encrypted format: iv:authTag:encryptedData (base64) - typically 100-500 chars depending on input
-- Date: 2026-01-10

-- =====================================================
-- STEP 1: Update table columns for encrypted data
-- =====================================================

-- Update applicant table columns
ALTER TABLE `applicant` 
    MODIFY COLUMN `applicant_full_name` VARCHAR(500) NULL,
    MODIFY COLUMN `applicant_contact_number` VARCHAR(500) NULL,
    MODIFY COLUMN `applicant_address` TEXT NULL;

-- Update spouse table columns
ALTER TABLE `spouse`
    MODIFY COLUMN `spouse_full_name` VARCHAR(500) NULL,
    MODIFY COLUMN `spouse_contact_number` VARCHAR(500) NULL;

-- Update other_information table columns
ALTER TABLE `other_information`
    MODIFY COLUMN `email_address` VARCHAR(500) NULL;

-- =====================================================
-- STEP 2: Recreate stored procedure with larger parameters
-- =====================================================

DELIMITER $$

DROP PROCEDURE IF EXISTS `createApplicantComplete`$$

CREATE PROCEDURE `createApplicantComplete` (
    IN `p_full_name` VARCHAR(500), 
    IN `p_contact_number` VARCHAR(500), 
    IN `p_address` TEXT, 
    IN `p_birthdate` DATE, 
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), 
    IN `p_educational_attainment` VARCHAR(100), 
    IN `p_nature_of_business` VARCHAR(255), 
    IN `p_capitalization` DECIMAL(15,2), 
    IN `p_source_of_capital` VARCHAR(255), 
    IN `p_previous_business_experience` TEXT, 
    IN `p_relative_stall_owner` ENUM('Yes','No'), 
    IN `p_spouse_full_name` VARCHAR(500), 
    IN `p_spouse_birthdate` DATE, 
    IN `p_spouse_educational_attainment` VARCHAR(100), 
    IN `p_spouse_contact_number` VARCHAR(500), 
    IN `p_spouse_occupation` VARCHAR(100), 
    IN `p_signature_of_applicant` VARCHAR(500), 
    IN `p_house_sketch_location` VARCHAR(500), 
    IN `p_valid_id` VARCHAR(500), 
    IN `p_email_address` VARCHAR(500)
)
BEGIN
    DECLARE new_applicant_id INT;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        -- Rollback the transaction on error
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error creating applicant record';
    END;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Insert applicant (main table)
    INSERT INTO applicant (
        applicant_full_name, 
        applicant_contact_number, 
        applicant_address,
        applicant_birthdate, 
        applicant_civil_status, 
        applicant_educational_attainment
    ) VALUES (
        p_full_name, 
        p_contact_number, 
        NULLIF(p_address, ''),
        p_birthdate, 
        COALESCE(p_civil_status, 'Single'), 
        NULLIF(p_educational_attainment, '')
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    -- Insert business information (always insert, allow NULLs)
    INSERT INTO business_information (
        applicant_id, 
        nature_of_business, 
        capitalization,
        source_of_capital, 
        previous_business_experience, 
        relative_stall_owner
    ) VALUES (
        new_applicant_id, 
        NULLIF(p_nature_of_business, ''), 
        p_capitalization,
        NULLIF(p_source_of_capital, ''), 
        NULLIF(p_previous_business_experience, ''), 
        COALESCE(p_relative_stall_owner, 'No')
    );
    
    -- Insert other information (always insert, allow NULLs)
    INSERT INTO other_information (
        applicant_id, 
        signature_of_applicant, 
        house_sketch_location, 
        valid_id, 
        email_address
    ) VALUES (
        new_applicant_id, 
        NULLIF(p_signature_of_applicant, ''), 
        NULLIF(p_house_sketch_location, ''),
        NULLIF(p_valid_id, ''), 
        p_email_address
    );
    
    -- Insert spouse information only if spouse name is provided
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO spouse (
            applicant_id, 
            spouse_full_name, 
            spouse_birthdate,
            spouse_educational_attainment, 
            spouse_contact_number, 
            spouse_occupation
        ) VALUES (
            new_applicant_id, 
            p_spouse_full_name, 
            p_spouse_birthdate,
            NULLIF(p_spouse_educational_attainment, ''), 
            NULLIF(p_spouse_contact_number, ''), 
            NULLIF(p_spouse_occupation, '')
        );
    END IF;
    
    -- Commit transaction
    COMMIT;
    
    -- Return the new applicant ID
    SELECT new_applicant_id AS new_applicant_id;
END$$

-- =====================================================
-- STEP 3: Update the updateApplicantComplete procedure
-- =====================================================

DROP PROCEDURE IF EXISTS `updateApplicantComplete`$$

CREATE PROCEDURE `updateApplicantComplete` (
    IN `p_applicant_id` INT,
    IN `p_full_name` VARCHAR(500), 
    IN `p_contact_number` VARCHAR(500), 
    IN `p_address` TEXT, 
    IN `p_birthdate` DATE, 
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), 
    IN `p_educational_attainment` VARCHAR(100), 
    IN `p_nature_of_business` VARCHAR(255), 
    IN `p_capitalization` DECIMAL(15,2), 
    IN `p_source_of_capital` VARCHAR(255), 
    IN `p_previous_business_experience` TEXT, 
    IN `p_relative_stall_owner` ENUM('Yes','No'), 
    IN `p_spouse_full_name` VARCHAR(500), 
    IN `p_spouse_birthdate` DATE, 
    IN `p_spouse_educational_attainment` VARCHAR(100), 
    IN `p_spouse_contact_number` VARCHAR(500), 
    IN `p_spouse_occupation` VARCHAR(100), 
    IN `p_signature_of_applicant` VARCHAR(500), 
    IN `p_house_sketch_location` VARCHAR(500), 
    IN `p_valid_id` VARCHAR(500), 
    IN `p_email_address` VARCHAR(500)
)
BEGIN
    DECLARE applicant_exists INT DEFAULT 0;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Error updating applicant record';
    END;
    
    -- Check if applicant exists
    SELECT COUNT(*) INTO applicant_exists FROM applicant WHERE applicant_id = p_applicant_id;
    
    IF applicant_exists = 0 THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Applicant not found';
    END IF;
    
    -- Start transaction
    START TRANSACTION;
    
    -- Update applicant main record
    UPDATE applicant SET
        applicant_full_name = COALESCE(p_full_name, applicant_full_name),
        applicant_contact_number = COALESCE(p_contact_number, applicant_contact_number),
        applicant_address = COALESCE(NULLIF(p_address, ''), applicant_address),
        applicant_birthdate = COALESCE(p_birthdate, applicant_birthdate),
        applicant_civil_status = COALESCE(p_civil_status, applicant_civil_status),
        applicant_educational_attainment = COALESCE(NULLIF(p_educational_attainment, ''), applicant_educational_attainment),
        updated_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    -- Update or insert business information
    INSERT INTO business_information (applicant_id, nature_of_business, capitalization, source_of_capital, previous_business_experience, relative_stall_owner)
    VALUES (p_applicant_id, NULLIF(p_nature_of_business, ''), p_capitalization, NULLIF(p_source_of_capital, ''), NULLIF(p_previous_business_experience, ''), COALESCE(p_relative_stall_owner, 'No'))
    ON DUPLICATE KEY UPDATE
        nature_of_business = COALESCE(NULLIF(p_nature_of_business, ''), nature_of_business),
        capitalization = COALESCE(p_capitalization, capitalization),
        source_of_capital = COALESCE(NULLIF(p_source_of_capital, ''), source_of_capital),
        previous_business_experience = COALESCE(NULLIF(p_previous_business_experience, ''), previous_business_experience),
        relative_stall_owner = COALESCE(p_relative_stall_owner, relative_stall_owner);
    
    -- Update or insert other information
    INSERT INTO other_information (applicant_id, signature_of_applicant, house_sketch_location, valid_id, email_address)
    VALUES (p_applicant_id, NULLIF(p_signature_of_applicant, ''), NULLIF(p_house_sketch_location, ''), NULLIF(p_valid_id, ''), p_email_address)
    ON DUPLICATE KEY UPDATE
        signature_of_applicant = COALESCE(NULLIF(p_signature_of_applicant, ''), signature_of_applicant),
        house_sketch_location = COALESCE(NULLIF(p_house_sketch_location, ''), house_sketch_location),
        valid_id = COALESCE(NULLIF(p_valid_id, ''), valid_id),
        email_address = COALESCE(p_email_address, email_address);
    
    -- Update or insert spouse information
    IF p_spouse_full_name IS NOT NULL AND p_spouse_full_name != '' THEN
        INSERT INTO spouse (applicant_id, spouse_full_name, spouse_birthdate, spouse_educational_attainment, spouse_contact_number, spouse_occupation)
        VALUES (p_applicant_id, p_spouse_full_name, p_spouse_birthdate, NULLIF(p_spouse_educational_attainment, ''), NULLIF(p_spouse_contact_number, ''), NULLIF(p_spouse_occupation, ''))
        ON DUPLICATE KEY UPDATE
            spouse_full_name = COALESCE(p_spouse_full_name, spouse_full_name),
            spouse_birthdate = COALESCE(p_spouse_birthdate, spouse_birthdate),
            spouse_educational_attainment = COALESCE(NULLIF(p_spouse_educational_attainment, ''), spouse_educational_attainment),
            spouse_contact_number = COALESCE(NULLIF(p_spouse_contact_number, ''), spouse_contact_number),
            spouse_occupation = COALESCE(NULLIF(p_spouse_occupation, ''), spouse_occupation);
    END IF;
    
    -- Commit transaction
    COMMIT;
    
    SELECT 'Applicant updated successfully' AS message;
END$$

DELIMITER ;

-- Record this migration
INSERT INTO migrations (migration_id, migration_name, version, applied_at) 
VALUES (99, '099_update_columns_for_encryption', '1.0.0', NOW())
ON DUPLICATE KEY UPDATE applied_at = NOW();
