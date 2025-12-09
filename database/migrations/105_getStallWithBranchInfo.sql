-- Migration: 105_getStallWithBranchInfo.sql
-- Description: getStallWithBranchInfo stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getStallWithBranchInfo`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallWithBranchInfo` (IN `p_stall_id` INT)   BEGIN
    SELECT st.stall_id, st.is_available, st.status, b.branch_id, b.branch_name
    FROM stall st
    JOIN section sec ON st.section_id = sec.section_id
    JOIN floor f ON sec.floor_id = f.floor_id
    JOIN branch b ON f.branch_id = b.branch_id
    WHERE st.stall_id = p_stall_id;
END$$

DELIMITER ;
