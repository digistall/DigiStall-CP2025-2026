-- Migration: 073_getBranchById.sql
-- Description: getBranchById stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBranchById`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBranchById` (IN `p_branch_id` INT)   BEGIN
    SELECT * FROM branch WHERE branch_id = p_branch_id;
END$$

DELIMITER ;
