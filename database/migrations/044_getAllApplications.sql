-- Migration: 044_getAllApplications.sql
-- Description: getAllApplications stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllApplications`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllApplications` ()   BEGIN
    SELECT 
        a.*,
        ap.applicant_full_name,
        ap.applicant_contact_number,
        s.stall_no,
        s.stall_location,
        b.branch_name
    FROM application a
    LEFT JOIN applicant ap ON a.applicant_id = ap.applicant_id
    LEFT JOIN stall s ON a.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON s.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    ORDER BY a.created_at DESC;
END$$

DELIMITER ;
