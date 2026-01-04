-- Migration: 209_sp_getSectionsByFloorIds.sql
-- Description: sp_getSectionsByFloorIds stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getSectionsByFloorIds`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getSectionsByFloorIds` (IN `p_floor_ids` VARCHAR(500))   BEGIN
  SET @sql = CONCAT('SELECT s.* FROM section s
    JOIN floor f ON s.floor_id = f.floor_id
    WHERE s.floor_id IN (', p_floor_ids, ')');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;
