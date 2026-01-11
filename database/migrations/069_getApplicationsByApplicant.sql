-- Migration: 069_getApplicationsByApplicant.sql
-- Description: getApplicationsByApplicant stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicationsByApplicant`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicationsByApplicant` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        a.*,
        s.stall_no,
        s.stall_location,
        s.rental_price,
        b.branch_name
    FROM application a
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE a.applicant_id = p_applicant_id
    ORDER BY a.created_at DESC;
END$$

DELIMITER ;
