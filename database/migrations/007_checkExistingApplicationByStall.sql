-- Migration 007: checkExistingApplicationByStall procedure
-- Description: Checks if an application exists for an applicant and stall in applications table
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `checkExistingApplicationByStall`$$

CREATE PROCEDURE `checkExistingApplicationByStall` (IN `p_applicant_id` INT, IN `p_stall_id` INT)
BEGIN
    SELECT application_id 
    FROM applications 
    WHERE applicant_id = p_applicant_id AND stall_id = p_stall_id;
END$$

DELIMITER ;
