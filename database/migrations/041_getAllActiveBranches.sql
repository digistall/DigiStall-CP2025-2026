-- Migration: 041_getAllActiveBranches.sql
-- Description: getAllActiveBranches stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getAllActiveBranches`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllActiveBranches` ()   BEGIN
    SELECT 
        branch_id,
        branch_name,
        area,
        status
    FROM branch
    WHERE status = 'Active'
    ORDER BY area, branch_name;
END$$

DELIMITER ;
