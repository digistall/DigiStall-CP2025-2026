-- Migration 014: createApplicant procedure
-- Description: Creates a new applicant record with basic information
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `createApplicant`$$

CREATE PROCEDURE `createApplicant` (
    IN `p_full_name` VARCHAR(255), 
    IN `p_contact_number` VARCHAR(20), 
    IN `p_address` TEXT, 
    IN `p_birthdate` DATE, 
    IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), 
    IN `p_educational_attainment` VARCHAR(100)
)
BEGIN
    INSERT INTO applicant (applicant_full_name, applicant_contact_number, applicant_address, applicant_birthdate, applicant_civil_status, applicant_educational_attainment)
    VALUES (p_full_name, p_contact_number, p_address, p_birthdate, p_civil_status, p_educational_attainment);
    
    SELECT LAST_INSERT_ID() as applicant_id;
END$$

DELIMITER ;
