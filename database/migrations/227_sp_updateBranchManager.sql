-- Migration: 227_sp_updateBranchManager.sql
-- Description: sp_updateBranchManager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_updateBranchManager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateBranchManager` (IN `p_manager_id` INT, IN `p_branch_id` INT, IN `p_manager_username` VARCHAR(100), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(150), IN `p_contact_number` VARCHAR(20), IN `p_password_hash` VARCHAR(255))   BEGIN
  UPDATE branch_manager 
  SET 
    branch_id = COALESCE(p_branch_id, branch_id),
    manager_username = COALESCE(p_manager_username, manager_username),
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    email = COALESCE(p_email, email),
    contact_number = COALESCE(p_contact_number, contact_number),
    password = CASE WHEN p_password_hash IS NOT NULL THEN p_password_hash ELSE password END,
    updated_at = NOW()
  WHERE branch_manager_id = p_manager_id;
  
  SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;
