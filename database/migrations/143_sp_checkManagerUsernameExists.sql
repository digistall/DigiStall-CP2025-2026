-- Migration: 143_sp_checkManagerUsernameExists.sql
-- Description: sp_checkManagerUsernameExists stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_checkManagerUsernameExists`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_checkManagerUsernameExists` (IN `p_username` VARCHAR(100), IN `p_exclude_manager_id` INT)   BEGIN
  SELECT branch_manager_id 
  FROM branch_manager 
  WHERE manager_username = p_username 
    AND branch_manager_id != p_exclude_manager_id;
END$$

DELIMITER ;
