-- Migration 006: checkExistingApplication procedure
-- Description: Checks if an application already exists for a given applicant and stall
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `checkExistingApplication`$$

CREATE PROCEDURE `checkExistingApplication` (IN `p_applicant_id` INT, IN `p_stall_id` INT)
BEGIN
    SELECT application_id 
    FROM application 
    WHERE applicant_id = p_applicant_id AND stall_id = p_stall_id;
END$$

DELIMITER ;
