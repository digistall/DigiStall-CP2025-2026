-- Migration: 062_getApplicantById.sql
-- Description: getApplicantById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantById` (IN `p_applicant_id` INT)   BEGIN
    SELECT * FROM applicant WHERE applicant_id = p_applicant_id;
END$$

DELIMITER ;
