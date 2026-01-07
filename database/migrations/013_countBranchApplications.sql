-- Migration 013: countBranchApplications procedure
-- Description: Counts non-rejected applications by branch for a specific applicant
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `countBranchApplications`$$

CREATE PROCEDURE `countBranchApplications` (IN `p_applicant_id` INT, IN `p_branch_id` INT)
BEGIN
    SELECT COUNT(*) as count 
    FROM applications a 
    JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.applicant_id = p_applicant_id 
      AND s.branch_id = p_branch_id 
      AND a.status != 'rejected';
END$$

DELIMITER ;
