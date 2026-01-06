-- Migration: 087_getFloorsByBranch.sql
-- Description: getFloorsByBranch stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getFloorsByBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getFloorsByBranch` (IN `p_branch_id` INT)   BEGIN
    SELECT * FROM floor WHERE branch_id = p_branch_id ORDER BY floor_number;
END$$

DELIMITER ;
