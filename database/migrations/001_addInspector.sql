-- Migration: 001_addInspector.sql
-- Description: Adds an inspector with branch assignment and action logging
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `addInspector`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addInspector` (IN `p_first_name` VARCHAR(100), IN `p_last_name` VARCHAR(100), IN `p_email` VARCHAR(255), IN `p_contact_no` VARCHAR(20), IN `p_password_plain` VARCHAR(255), IN `p_branch_id` INT, IN `p_date_hired` DATE, IN `p_branch_manager_id` INT)   BEGIN
    DECLARE new_inspector_id INT;

    INSERT INTO inspector (first_name, last_name, email, contact_no, password, date_hired, status)
    VALUES (p_first_name, p_last_name, p_email, p_contact_no, SHA2(p_password_plain, 256), IFNULL(p_date_hired, CURRENT_DATE), 'active');

    SET new_inspector_id = LAST_INSERT_ID();

    INSERT INTO inspector_assignment (inspector_id, branch_id, start_date, status, remarks)
    VALUES (new_inspector_id, p_branch_id, CURRENT_DATE, 'Active', 'Newly hired inspector');

    INSERT INTO inspector_action_log (inspector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (new_inspector_id, p_branch_id, p_branch_manager_id, 'New Hire', NOW(),
            CONCAT('Inspector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id));

    SELECT CONCAT('Inspector ', p_first_name, ' ', p_last_name, ' successfully added and logged as New Hire under branch ID ', p_branch_id) AS message;
END$$

DELIMITER ;
