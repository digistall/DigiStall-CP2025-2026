-- Migration: 172_sp_getAllActiveEmployees.sql
-- Description: sp_getAllActiveEmployees stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getAllActiveEmployees`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getAllActiveEmployees` (IN `p_status` VARCHAR(50))   BEGIN
  SELECT be.*, b.branch_name, 
         bm.first_name as manager_first_name, bm.last_name as manager_last_name 
  FROM business_employee be 
  LEFT JOIN branch b ON be.branch_id = b.branch_id 
  LEFT JOIN business_manager bm ON be.created_by_manager = bm.business_manager_id 
  WHERE be.status = p_status 
  ORDER BY be.created_at DESC;
END$$

DELIMITER ;
