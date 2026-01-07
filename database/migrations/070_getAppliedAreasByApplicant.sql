-- Migration: 070_getAppliedAreasByApplicant.sql
-- Description: getAppliedAreasByApplicant stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAppliedAreasByApplicant`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAppliedAreasByApplicant` (IN `p_applicant_id` INT)   BEGIN
    SELECT DISTINCT 
        b.area,
        b.branch_id,
        b.branch_name
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id
      AND app.application_status IN ('Pending', 'Approved');
END$$

DELIMITER ;
