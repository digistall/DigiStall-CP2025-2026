-- Migration: 091_getMobileUserByUsername.sql
-- Description: getMobileUserByUsername stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getMobileUserByUsername`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMobileUserByUsername` (IN `p_username` VARCHAR(100))   BEGIN
    SELECT 
        c.registrationid,
        c.applicant_id, 
        c.user_name, 
        c.password_hash,
        c.is_active,
        a.applicant_full_name,
        COALESCE(a.applicant_email, oi.email_address) as applicant_email,
        a.applicant_contact_number
    FROM credential c
    LEFT JOIN applicant a ON c.applicant_id = a.applicant_id
    LEFT JOIN other_information oi ON a.applicant_id = oi.applicant_id
    WHERE c.user_name = p_username AND c.is_active = 1;
END$$

DELIMITER ;
