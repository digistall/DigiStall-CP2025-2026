-- Migration: 089_getMobileApplicationStatus.sql
-- Description: getMobileApplicationStatus stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getMobileApplicationStatus`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMobileApplicationStatus` (IN `p_application_id` INT, IN `p_user_id` INT)   BEGIN
    SELECT a.*, s.stall_name, s.area, s.location 
    FROM applications a 
    LEFT JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.application_id = p_application_id AND a.applicant_id = p_user_id;
END$$

DELIMITER ;
