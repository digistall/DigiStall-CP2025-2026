-- Migration: 189_sp_getDistinctAreas.sql
-- Description: sp_getDistinctAreas stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getDistinctAreas`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getDistinctAreas` ()   BEGIN
  SELECT DISTINCT area FROM branch WHERE status = 'Active' ORDER BY area ASC;
END$$

DELIMITER ;
