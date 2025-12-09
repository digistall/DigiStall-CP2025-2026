-- Migration: 099_getStallById.sql
-- Description: getStallById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallById` (IN `p_stall_id` INT)   BEGIN
    SELECT 
        s.*,
        sec.section_name,
        f.floor_name,
        b.branch_name,
        b.area,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    JOIN section sec ON s.section_id = sec.section_id
    JOIN floor f ON s.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN branch_manager bm ON s.created_by_manager = bm.branch_manager_id
    WHERE s.stall_id = p_stall_id;
END$$

DELIMITER ;
