-- Migration: 151_sp_createApplication.sql
-- Description: sp_createApplication stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createApplication`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createApplication` (IN `p_stall_id` INT, IN `p_applicant_id` INT)   BEGIN
    INSERT INTO application (stall_id, applicant_id, application_date, application_status)
    VALUES (p_stall_id, p_applicant_id, CURDATE(), 'Pending');
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

DELIMITER ;
