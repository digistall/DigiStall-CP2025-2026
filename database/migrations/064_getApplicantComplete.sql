-- Migration: 064_getApplicantComplete.sql
-- Description: getApplicantComplete stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantComplete`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantComplete` (IN `p_applicant_id` INT)   BEGIN
    IF p_applicant_id IS NULL THEN
        SELECT 
            a.*,
            bi.nature_of_business, bi.capitalization, bi.source_of_capital,
            bi.previous_business_experience, bi.relative_stall_owner,
            oi.email_address, oi.signature_of_applicant, oi.house_sketch_location, oi.valid_id,
            s.spouse_full_name, s.spouse_birthdate, s.spouse_educational_attainment,
            s.spouse_contact_number, s.spouse_occupation
        FROM applicant a
        LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
        LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
        LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
        ORDER BY a.created_at DESC;
    ELSE
        SELECT 
            a.*,
            bi.nature_of_business, bi.capitalization, bi.source_of_capital,
            bi.previous_business_experience, bi.relative_stall_owner,
            oi.email_address, oi.signature_of_applicant, oi.house_sketch_location, oi.valid_id,
            s.spouse_full_name, s.spouse_birthdate, s.spouse_educational_attainment,
            s.spouse_contact_number, s.spouse_occupation
        FROM applicant a
        LEFT JOIN business_information bi ON a.applicant_id = bi.applicant_id
        LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
        LEFT JOIN spouse s ON a.applicant_id = s.applicant_id
        WHERE a.applicant_id = p_applicant_id;
    END IF;
END$$

DELIMITER ;
