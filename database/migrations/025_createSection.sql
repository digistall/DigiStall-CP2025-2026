-- Migration: 025_createSection.sql
-- Description: createSection stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `createSection`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createSection` (IN `p_floor_id` INT, IN `p_section_name` VARCHAR(100), IN `p_branch_id` INT)   BEGIN
    INSERT INTO section (floor_id, section_name)
    VALUES (p_floor_id, p_section_name);
    
    SELECT LAST_INSERT_ID() as section_id;
END$$

DELIMITER ;
