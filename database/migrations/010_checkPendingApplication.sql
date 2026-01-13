-- Migration 010: checkPendingApplication procedure
-- Description: Checks if a pending application exists for a given application and applicant
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `checkPendingApplication`$$

CREATE PROCEDURE `checkPendingApplication` (IN `p_application_id` INT, IN `p_applicant_id` INT)
BEGIN
    SELECT * FROM applications 
    WHERE application_id = p_application_id 
      AND applicant_id = p_applicant_id 
      AND status = 'pending';
END$$

DELIMITER ;
