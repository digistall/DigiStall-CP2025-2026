-- Migration 008: checkExistingMobileUser procedure
-- Description: Checks if a mobile user exists by username or email
-- Date: 2025-12-09

DELIMITER $$

DROP PROCEDURE IF EXISTS `checkExistingMobileUser`$$

CREATE PROCEDURE `checkExistingMobileUser` (IN `p_username` VARCHAR(100), IN `p_email` VARCHAR(255))
BEGIN
    SELECT * FROM applicant 
    WHERE applicant_username = p_username OR applicant_email = p_email;
END$$

DELIMITER ;
