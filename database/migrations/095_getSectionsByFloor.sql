-- Migration: 095_getSectionsByFloor.sql
-- Description: getSectionsByFloor stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getSectionsByFloor`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getSectionsByFloor` (IN `p_floor_id` INT)   BEGIN
    SELECT * FROM section WHERE floor_id = p_floor_id ORDER BY section_name;
END$$

DELIMITER ;
