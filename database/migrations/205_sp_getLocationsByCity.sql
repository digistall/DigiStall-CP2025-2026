-- Migration: 205_sp_getLocationsByCity.sql
-- Description: sp_getLocationsByCity stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getLocationsByCity`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getLocationsByCity` (IN `p_city` VARCHAR(100))   BEGIN
  SELECT DISTINCT location, branch_name as branch 
  FROM branch 
  WHERE city = p_city AND status = 'Active' 
  ORDER BY location;
END$$

DELIMITER ;
