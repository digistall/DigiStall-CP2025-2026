-- Migration: 225_sp_storeRefreshToken.sql
-- Description: sp_storeRefreshToken stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_storeRefreshToken`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_storeRefreshToken` (IN `p_token_id` VARCHAR(255), IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_token_hash` VARCHAR(255), IN `p_device_info` VARCHAR(255), IN `p_ip_address` VARCHAR(50), IN `p_expires_at` DATETIME)   BEGIN
  INSERT INTO refresh_tokens (token_id, user_id, user_type, token_hash, device_info, ip_address, expires_at, created_at)
  VALUES (p_token_id, p_user_id, p_user_type, p_token_hash, p_device_info, p_ip_address, p_expires_at, NOW());
END$$

DELIMITER ;
