-- Migration: 059_getApplicantApplicationsDetailed.sql
-- Description: getApplicantApplicationsDetailed stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantApplicationsDetailed`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantApplicationsDetailed` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        app.application_id,
        app.applicant_id,
        app.stall_id,
        app.application_status,
        app.application_date,
        app.updated_at,
        s.stall_no as stall_number,
        s.size as stall_size,
        s.rental_price as monthly_rent,
        s.status as stall_status,
        b.branch_id,
        b.branch_name,
        b.area,
        b.status as branch_status
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC;
END$$

DELIMITER ;
