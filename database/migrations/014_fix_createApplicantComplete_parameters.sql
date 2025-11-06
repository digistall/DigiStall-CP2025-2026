-- Migration 014: Fix createApplicantComplete stored procedure parameters
-- Fix parameter mismatch: procedure expects 16 but backend sends 20

DELIMITER $$

-- Drop and recreate the procedure with correct parameters
DROP PROCEDURE IF EXISTS `createApplicantComplete`$$

CREATE PROCEDURE `createApplicantComplete`(
    -- Personal Information (6 parameters)
    IN `p_full_name` VARCHAR(255),
    IN `p_contact_number` VARCHAR(20),
    IN `p_address` TEXT,
    IN `p_birthdate` DATE,
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'),
    IN `p_educational_attainment` VARCHAR(100),
    -- Business Information (5 parameters)
    IN `p_nature_of_business` VARCHAR(255),
    IN `p_capitalization` DECIMAL(15,2),
    IN `p_source_of_capital` VARCHAR(255),
    IN `p_previous_business_experience` TEXT,
    IN `p_relative_stall_owner` ENUM('Yes','No'),
    -- Spouse Information (5 parameters)
    IN `p_spouse_full_name` VARCHAR(255),
    IN `p_spouse_birthdate` DATE,
    IN `p_spouse_educational_attainment` VARCHAR(100),
    IN `p_spouse_contact_number` VARCHAR(20),
    IN `p_spouse_occupation` VARCHAR(100),
    -- Other Information (4 parameters) - TOTAL: 20 parameters
    IN `p_signature_of_applicant` VARCHAR(500),
    IN `p_house_sketch_location` VARCHAR(500),
    IN `p_valid_id` VARCHAR(500),
    IN `p_email_address` VARCHAR(255)
)
BEGIN
    DECLARE new_applicant_id INT;
    
    -- Insert applicant
    INSERT INTO applicant (
        applicant_full_name, applicant_contact_number, applicant_address,
        applicant_birthdate, applicant_civil_status, applicant_educational_attainment
    ) VALUES (
        p_full_name, p_contact_number, p_address,
        p_birthdate, p_civil_status, p_educational_attainment
    );
    
    SET new_applicant_id = LAST_INSERT_ID();
    
    -- Insert business information (including relative_stall_owner)
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience, relative_stall_owner
    ) VALUES (
        new_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience, COALESCE(p_relative_stall_owner, 'No')
    );
    
    -- Insert other information (including signature, sketch, valid_id, email)
    INSERT INTO other_information (
        applicant_id, signature_of_applicant, house_sketch_location, 
        valid_id, email_address
    ) VALUES (
        new_applicant_id, p_signature_of_applicant, p_house_sketch_location,
        p_valid_id, p_email_address
    );
    
    -- Insert spouse information if provided
    IF p_spouse_full_name IS NOT NULL THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            new_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        );
    END IF;
    
    SELECT new_applicant_id as new_applicant_id;
END$$

DELIMITER ;

-- Record migration
INSERT INTO migrations (migration_name, version, executed_at)
VALUES ('014_fix_createApplicantComplete_parameters', '1.0.0', NOW());