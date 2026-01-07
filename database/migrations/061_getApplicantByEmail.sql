-- Migration: 061_getApplicantByEmail.sql
-- Description: getApplicantByEmail stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantByEmail`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantByEmail` (IN `p_email` VARCHAR(100))   BEGIN
    SELECT * FROM applicant WHERE applicant_email = p_email;
END$$

DELIMITER ;
