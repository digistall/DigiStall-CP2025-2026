-- Migration: 187_sp_getBusinessInfoByApplicantId.sql
-- Description: sp_getBusinessInfoByApplicantId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getBusinessInfoByApplicantId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getBusinessInfoByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM business_information WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
