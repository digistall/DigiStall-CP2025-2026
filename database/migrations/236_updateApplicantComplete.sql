-- Migration: 236_updateApplicantComplete.sql
-- Description: updateApplicantComplete stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateApplicantComplete`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateApplicantComplete` (IN `p_applicant_id` INT, IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_birthdate` DATE, IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), IN `p_educational_attainment` VARCHAR(100), IN `p_nature_of_business` VARCHAR(255), IN `p_capitalization` DECIMAL(15,2), IN `p_source_of_capital` VARCHAR(255), IN `p_previous_business_experience` TEXT, IN `p_email_address` VARCHAR(255), IN `p_spouse_full_name` VARCHAR(255), IN `p_spouse_birthdate` DATE, IN `p_spouse_educational_attainment` VARCHAR(100), IN `p_spouse_contact_number` VARCHAR(20), IN `p_spouse_occupation` VARCHAR(100))   BEGIN
    
    UPDATE applicant
    SET 
        applicant_full_name = COALESCE(p_full_name, applicant_full_name),
        applicant_contact_number = COALESCE(p_contact_number, applicant_contact_number),
        applicant_address = COALESCE(p_address, applicant_address),
        applicant_birthdate = COALESCE(p_birthdate, applicant_birthdate),
        applicant_civil_status = COALESCE(p_civil_status, applicant_civil_status),
        applicant_educational_attainment = COALESCE(p_educational_attainment, applicant_educational_attainment),
        updated_at = NOW()
    WHERE applicant_id = p_applicant_id;
    
    
    INSERT INTO business_information (
        applicant_id, nature_of_business, capitalization,
        source_of_capital, previous_business_experience
    ) VALUES (
        p_applicant_id, p_nature_of_business, p_capitalization,
        p_source_of_capital, p_previous_business_experience
    ) ON DUPLICATE KEY UPDATE
        nature_of_business = VALUES(nature_of_business),
        capitalization = VALUES(capitalization),
        source_of_capital = VALUES(source_of_capital),
        previous_business_experience = VALUES(previous_business_experience);
    
    
    INSERT INTO other_information (
        applicant_id, email_address
    ) VALUES (
        p_applicant_id, p_email_address
    ) ON DUPLICATE KEY UPDATE
        email_address = VALUES(email_address);

    
    
    IF p_spouse_full_name IS NOT NULL THEN
        INSERT INTO spouse (
            applicant_id, spouse_full_name, spouse_birthdate,
            spouse_educational_attainment, spouse_contact_number, spouse_occupation
        ) VALUES (
            p_applicant_id, p_spouse_full_name, p_spouse_birthdate,
            p_spouse_educational_attainment, p_spouse_contact_number, p_spouse_occupation
        ) ON DUPLICATE KEY UPDATE
            spouse_full_name = VALUES(spouse_full_name),
            spouse_birthdate = VALUES(spouse_birthdate),
            spouse_educational_attainment = VALUES(spouse_educational_attainment),
            spouse_contact_number = VALUES(spouse_contact_number),
            spouse_occupation = VALUES(spouse_occupation);
    END IF;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
