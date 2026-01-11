-- Migration: 058_getApplicantAdditionalInfo.sql
-- Description: getApplicantAdditionalInfo stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantAdditionalInfo`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantAdditionalInfo` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        
        oi.email_address,
        oi.signature_of_applicant,
        oi.house_sketch_location,
        oi.valid_id,
        
        bi.nature_of_business,
        bi.capitalization,
        bi.source_of_capital,
        bi.previous_business_experience,
        bi.relative_stall_owner,
        
        sp.spouse_full_name,
        sp.spouse_birthdate,
        sp.spouse_educational_attainment,
        sp.spouse_contact_number,
        sp.spouse_occupation
    FROM applicant a
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
    LEFT JOIN spouse sp ON a.applicant_id = sp.applicant_id
    WHERE a.applicant_id = p_applicant_id
    LIMIT 1;
END$$

DELIMITER ;
