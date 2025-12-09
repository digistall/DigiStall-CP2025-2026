-- Migration: 203_sp_getLocationsByArea.sql
-- Description: sp_getLocationsByArea stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLocationsByArea`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLocationsByArea` (IN `p_area` VARCHAR(100))   BEGIN
  SELECT DISTINCT location, branch_name as branch 
  FROM branch 
  WHERE area = p_area AND status = 'Active' 
  ORDER BY location;
END$$

DELIMITER ;
