-- Migration: 063_getApplicantByUsername.sql
-- Description: getApplicantByUsername stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantByUsername`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantByUsername` (IN `p_username` VARCHAR(50))   BEGIN
    SELECT * FROM applicant WHERE applicant_username = p_username;
END$$

DELIMITER ;
