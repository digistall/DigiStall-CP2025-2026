-- Migration: 180_sp_getApplicationByApplicantId.sql
-- Description: sp_getApplicationByApplicantId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getApplicationByApplicantId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getApplicationByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT 
        app.application_id,
        app.stall_id,
        app.application_status,
        app.application_date,
        s.stall_no,
        s.rental_price,
        s.stall_location,
        s.size,
        sec.section_id,
        f.floor_id,
        b.branch_id,
        b.branch_name
    FROM application app
    LEFT JOIN stall s ON app.stall_id = s.stall_id
    LEFT JOIN section sec ON s.section_id = sec.section_id
    LEFT JOIN floor f ON sec.floor_id = f.floor_id
    LEFT JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
    ORDER BY app.application_date DESC
    LIMIT 1;
END$$

DELIMITER ;
