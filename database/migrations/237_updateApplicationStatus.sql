-- Migration: 237_updateApplicationStatus.sql
-- Description: updateApplicationStatus stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `updateApplicationStatus`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateApplicationStatus` (IN `p_application_id` INT, IN `p_status` ENUM('Pending','Under Review','Approved','Rejected','Cancelled'))   BEGIN
    UPDATE application
    SET application_status = p_status, updated_at = NOW()
    WHERE application_id = p_application_id;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
