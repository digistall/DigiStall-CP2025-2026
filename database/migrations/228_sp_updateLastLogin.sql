-- Migration: 228_sp_updateLastLogin.sql
-- Description: sp_updateLastLogin stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_updateLastLogin`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateLastLogin` (IN `p_table_name` VARCHAR(50), IN `p_user_id_field` VARCHAR(50), IN `p_user_id` INT)   BEGIN
  SET @sql = CONCAT('UPDATE ', p_table_name, ' SET last_login = NOW() WHERE ', p_user_id_field, ' = ', p_user_id);
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;
