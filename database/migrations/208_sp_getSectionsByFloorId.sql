-- Migration: 208_sp_getSectionsByFloorId.sql
-- Description: sp_getSectionsByFloorId stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getSectionsByFloorId`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getSectionsByFloorId` (IN `p_floor_id` INT)   BEGIN
  SELECT s.* FROM section s
  JOIN floor f ON s.floor_id = f.floor_id
  WHERE s.floor_id = p_floor_id;
END$$

DELIMITER ;
