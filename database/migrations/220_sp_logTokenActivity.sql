-- Migration: 220_sp_logTokenActivity.sql
-- Description: sp_logTokenActivity stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_logTokenActivity`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_logTokenActivity` (IN `p_token_id` VARCHAR(255), IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_activity_type` VARCHAR(50), IN `p_ip_address` VARCHAR(50), IN `p_user_agent` VARCHAR(255), IN `p_success` TINYINT)   BEGIN
  INSERT INTO token_activity_log (token_id, user_id, user_type, activity_type, ip_address, user_agent, success, created_at)
  VALUES (p_token_id, p_user_id, p_user_type, p_activity_type, p_ip_address, p_user_agent, p_success, NOW());
END$$

DELIMITER ;
