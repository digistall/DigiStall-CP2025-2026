-- Migration 015: createApplicantComplete procedure
-- Description: Creates a complete applicant record with all related information (business, spouse, other info)
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `createApplicantComplete`$$

CREATE PROCEDURE `createApplicantComplete` (
    IN `p_full_name` VARCHAR(255), 
    IN `p_contact_number` VARCHAR(20), 
    IN `p_address` TEXT, 
    IN `p_birthdate` DATE, 
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), 
    IN `p_educational_attainment` VARCHAR(100), 
    IN `p_nature_of_business` VARCHAR(255), 
    IN `p_capitalization` DECIMAL(15,2), 
    IN `p_source_of_capital` VARCHAR(255), 
    IN `p_previous_business_experience` TEXT, 
    IN `p_relative_stall_owner` ENUM('Yes','No'), 
    IN `p_spouse_full_name` VARCHAR(255), 
    IN `p_spouse_birthdate` DATE, 
    IN `p_spouse_educational_attainment` VARCHAR(100), 
    IN `p_spouse_contact_number` VARCHAR(20), 
    IN `p_spouse_occupation` VARCHAR(100), 
    IN `p_signature_of_applicant` VARCHAR(500), 
    IN `p_house_sketch_location` VARCHAR(500), 
    IN `p_valid_id` VARCHAR(500), 
    IN `p_email_address` VARCHAR(255)
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
    SELECT new_applicant_id as new_applicant_id;
END$$

DELIMITER ;
