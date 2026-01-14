-- Migration: 030_deleteApplicant.sql
-- Description: deleteApplicant stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteApplicant`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteApplicant` (IN `p_applicant_id` INT)   BEGIN
    -- Archive or mark as deleted
    UPDATE applicant SET updated_at = NOW() WHERE applicant_id = p_applicant_id;
    DELETE FROM applicant WHERE applicant_id = p_applicant_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
