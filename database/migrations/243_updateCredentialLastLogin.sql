-- Migration: 243_updateCredentialLastLogin.sql
-- Description: updateCredentialLastLogin stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateCredentialLastLogin`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateCredentialLastLogin` (IN `p_applicant_id` INT)   BEGIN
    UPDATE credential 
    SET last_login = NOW()
    WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
