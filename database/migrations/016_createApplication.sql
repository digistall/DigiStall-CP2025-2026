-- Migration: 016_createApplication.sql
-- Description: createApplication stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createApplication`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createApplication` (IN `p_stall_id` INT, IN `p_applicant_id` INT, IN `p_application_date` DATE, IN `p_application_status` ENUM('Pending','Under Review','Approved','Rejected','Cancelled'))   BEGIN
    INSERT INTO application (stall_id, applicant_id, application_date, application_status)
    VALUES (p_stall_id, p_applicant_id, p_application_date, p_application_status);
    
    SELECT LAST_INSERT_ID() as application_id;
END$$

DELIMITER ;
