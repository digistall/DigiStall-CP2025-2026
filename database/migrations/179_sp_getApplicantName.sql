-- Migration: 179_sp_getApplicantName.sql
-- Description: sp_getApplicantName stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getApplicantName`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getApplicantName` (IN `p_applicant_id` INT)   BEGIN
  SELECT applicant_full_name FROM applicant WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
