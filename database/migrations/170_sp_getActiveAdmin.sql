-- Migration: 170_sp_getActiveAdmin.sql
-- Description: sp_getActiveAdmin stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getActiveAdmin`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getActiveAdmin` ()   BEGIN
  SELECT admin_id FROM admin WHERE status = 'Active' LIMIT 1;
END$$

DELIMITER ;
