-- Migration: 235_updateApplicant.sql
-- Description: updateApplicant stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateApplicant`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateApplicant` (IN `p_applicant_id` INT, IN `p_full_name` VARCHAR(255), IN `p_contact_number` VARCHAR(20), IN `p_address` TEXT, IN `p_birthdate` DATE, IN `p_civil_status` ENUM('Single','Married','Divorced','Widowed'), IN `p_educational_attainment` VARCHAR(100))   BEGIN
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
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
