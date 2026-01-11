-- Migration: 144_sp_checkManagerUsernameGlobal.sql
-- Description: sp_checkManagerUsernameGlobal stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkManagerUsernameGlobal`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerUsernameGlobal` (IN `p_username` VARCHAR(100))   BEGIN
  SELECT branch_manager_id FROM branch_manager WHERE manager_username = p_username;
END$$

DELIMITER ;
