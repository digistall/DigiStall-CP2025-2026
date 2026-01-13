-- Migration: 174_sp_getAllSections.sql
-- Description: sp_getAllSections stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getAllSections`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllSections` ()   BEGIN
  SELECT s.* FROM section s;
END$$

DELIMITER ;
