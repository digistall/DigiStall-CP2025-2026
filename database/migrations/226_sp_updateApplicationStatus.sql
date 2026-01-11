-- Migration: 226_sp_updateApplicationStatus.sql
-- Description: sp_updateApplicationStatus stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_updateApplicationStatus`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateApplicationStatus` (IN `p_application_id` INT, IN `p_status` VARCHAR(50))   BEGIN
  UPDATE application SET application_status = p_status WHERE application_id = p_application_id;
END$$

DELIMITER ;
