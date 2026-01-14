-- Migration: 032_deleteApplication.sql
-- Description: deleteApplication stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `deleteApplication`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteApplication` (IN `p_application_id` INT)   BEGIN
    DELETE FROM application WHERE application_id = p_application_id;
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
