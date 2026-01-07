-- Migration: 155_sp_createBranchManager.sql
-- Description: sp_createBranchManager stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_createBranchManager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_createBranchManager` (IN `p_branch_id` INT, IN `p_manager_username` VARCHAR(100), IN `p_password_hash` VARCHAR(255), IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(150), IN `p_contact_number` VARCHAR(20))   BEGIN
  INSERT INTO branch_manager (
    branch_id, manager_username, password, first_name, last_name, email, contact_number, status, created_at
  ) VALUES (
    p_branch_id, p_manager_username, p_password_hash, p_first_name, p_last_name, p_email, p_contact_number, 'Active', NOW()
  );
  
  SELECT LAST_INSERT_ID() as branch_manager_id;
END$$

DELIMITER ;
