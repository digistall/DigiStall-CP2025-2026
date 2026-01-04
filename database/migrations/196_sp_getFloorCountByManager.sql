-- Migration: 196_sp_getFloorCountByManager.sql
-- Description: sp_getFloorCountByManager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getFloorCountByManager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorCountByManager` (IN `p_manager_id` INT)   BEGIN
  SELECT COUNT(*) as floor_count FROM floor WHERE branch_manager_id = p_manager_id;
END$$

DELIMITER ;
