-- Migration: 066_getApplicantLoginCredentials.sql
-- Description: getApplicantLoginCredentials stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantLoginCredentials`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantLoginCredentials` (IN `p_username` VARCHAR(255))   BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id,
        c.user_name,
        c.password_hash,
        c.created_date,
        c.last_login,
        c.is_active,
        a.applicant_full_name,
        a.applicant_contact_number,
        a.applicant_address,
        a.applicant_birthdate,
        a.applicant_civil_status,
        a.applicant_educational_attainment,
        oi.email_address as applicant_email
    FROM credential c
    INNER JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username 
      AND c.is_active = 1
    LIMIT 1;
END$$

DELIMITER ;
