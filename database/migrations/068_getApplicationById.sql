-- Migration: 068_getApplicationById.sql
-- Description: getApplicationById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicationById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicationById` (IN `p_application_id` INT)   BEGIN
    SELECT 
        a.*,
        ap.applicant_full_name,
        ap.applicant_contact_number,
        ap.applicant_email,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.application_id = p_application_id;
END$$

DELIMITER ;
