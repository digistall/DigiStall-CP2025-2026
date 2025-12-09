-- Migration: 054_getAllStallsDetailed.sql
-- Description: getAllStallsDetailed stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllStallsDetailed`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllStallsDetailed` ()   BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    ORDER BY b.branch_name, f.floor_name, sec.section_name;
END$$

DELIMITER ;
