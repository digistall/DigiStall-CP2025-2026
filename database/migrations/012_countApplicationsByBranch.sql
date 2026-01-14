-- Migration 012: countApplicationsByBranch procedure
-- Description: Counts applications by branch for a specific applicant
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `countApplicationsByBranch`$$

CREATE PROCEDURE `countApplicationsByBranch` (IN `p_applicant_id` INT, IN `p_branch_id` INT)
BEGIN
    SELECT COUNT(*) as count 
    FROM application app
    JOIN stall st ON app.stall_id = st.stall_id
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE app.applicant_id = p_applicant_id AND b.branch_id = p_branch_id;
END$$

DELIMITER ;
