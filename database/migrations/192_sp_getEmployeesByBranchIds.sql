-- Migration: 192_sp_getEmployeesByBranchIds.sql
-- Description: sp_getEmployeesByBranchIds stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getEmployeesByBranchIds`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getEmployeesByBranchIds` (IN `p_status` VARCHAR(50), IN `p_branch_ids` VARCHAR(500))   BEGIN
  SET @sql = CONCAT(
    'SELECT be.*, b.branch_name, bm.first_name as manager_first_name, bm.last_name as manager_last_name ',
    'FROM business_employee be ',
    'LEFT JOIN branch b ON be.branch_id = b.branch_id ',
    'LEFT JOIN business_manager bm ON be.created_by_manager = bm.business_manager_id ',
    'WHERE be.status = ''', p_status, ''' AND be.branch_id IN (', p_branch_ids, ') ',
    'ORDER BY be.created_at DESC'
  );
  PREPARE stmt FROM @sql;
  EXECUTE stmt;
  DEALLOCATE PREPARE stmt;
END$$

DELIMITER ;
