-- Migration: 195_sp_getFloorByManagerWithDetails.sql
-- Description: sp_getFloorByManagerWithDetails stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getFloorByManagerWithDetails`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getFloorByManagerWithDetails` (IN `p_manager_id` INT)   BEGIN
  SELECT f.* FROM floor f
  JOIN branch b ON f.branch_id = b.branch_id
  JOIN business_manager bm ON b.branch_id = bm.branch_id
  WHERE bm.business_manager_id = p_manager_id;
END$$

DELIMITER ;
