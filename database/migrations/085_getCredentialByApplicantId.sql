-- Migration: 085_getCredentialByApplicantId.sql
-- Description: getCredentialByApplicantId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getCredentialByApplicantId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getCredentialByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM credential WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
