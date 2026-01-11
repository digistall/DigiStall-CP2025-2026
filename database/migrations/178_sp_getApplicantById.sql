-- Migration: 178_sp_getApplicantById.sql
-- Description: sp_getApplicantById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getApplicantById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getApplicantById` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM applicant WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
