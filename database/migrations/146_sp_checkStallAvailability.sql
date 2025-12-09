-- Migration: 146_sp_checkStallAvailability.sql
-- Description: sp_checkStallAvailability stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkStallAvailability`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkStallAvailability` (IN `p_stall_id` INT)   BEGIN
    SELECT stall_id, is_available, status FROM stall WHERE stall_id = p_stall_id;
END$$

DELIMITER ;
