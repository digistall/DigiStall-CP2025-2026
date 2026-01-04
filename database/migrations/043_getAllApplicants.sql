-- Migration: 043_getAllApplicants.sql
-- Description: getAllApplicants stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllApplicants`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllApplicants` ()   BEGIN
    SELECT * FROM applicant ORDER BY created_at DESC;
END$$

DELIMITER ;
