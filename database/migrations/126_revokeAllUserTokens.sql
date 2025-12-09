-- Migration: 126_revokeAllUserTokens.sql
-- Description: revokeAllUserTokens stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `revokeAllUserTokens`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `revokeAllUserTokens` (IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_reason` VARCHAR(255))   BEGIN
    
    
    SELECT p_user_id as user_id, p_user_type as user_type, 'tokens_revoked' as status;
END$$

DELIMITER ;
