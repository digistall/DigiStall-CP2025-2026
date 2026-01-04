-- Migration: 173_sp_getAllFloors.sql
-- Description: sp_getAllFloors stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getAllFloors`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllFloors` ()   BEGIN
  SELECT f.* FROM floor f;
END$$

DELIMITER ;
