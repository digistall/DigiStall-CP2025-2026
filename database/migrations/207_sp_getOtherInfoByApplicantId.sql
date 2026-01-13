-- Migration: 207_sp_getOtherInfoByApplicantId.sql
-- Description: sp_getOtherInfoByApplicantId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getOtherInfoByApplicantId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getOtherInfoByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM other_information WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
