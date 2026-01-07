-- Migration: 090_getMobileUserApplications.sql
-- Description: getMobileUserApplications stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getMobileUserApplications`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getMobileUserApplications` (IN `p_user_id` INT)   BEGIN
    SELECT a.*, s.stall_name, s.area, s.location 
    FROM applications a 
    LEFT JOIN stalls s ON a.stall_id = s.stall_id 
    WHERE a.applicant_id = p_user_id 
    ORDER BY a.created_at DESC;
END$$

DELIMITER ;
