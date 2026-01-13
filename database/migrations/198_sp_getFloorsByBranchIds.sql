-- Migration: 198_sp_getFloorsByBranchIds.sql
-- Description: sp_getFloorsByBranchIds stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getFloorsByBranchIds`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorsByBranchIds` (IN `p_branch_ids` VARCHAR(500))   BEGIN
  SET @sql = CONCAT('SELECT f.* FROM floor f WHERE f.branch_id IN (', p_branch_ids, ')');
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;
