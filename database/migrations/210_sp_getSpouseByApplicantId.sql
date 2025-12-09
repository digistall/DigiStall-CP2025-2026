-- Migration: 210_sp_getSpouseByApplicantId.sql
-- Description: sp_getSpouseByApplicantId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getSpouseByApplicantId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getSpouseByApplicantId` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM spouse WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
