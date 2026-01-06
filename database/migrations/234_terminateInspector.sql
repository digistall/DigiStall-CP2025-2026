-- Migration: 234_terminateInspector.sql
-- Description: terminateInspector stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `terminateInspector`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `terminateInspector` (IN `p_inspector_id` INT, IN `p_reason` VARCHAR(255), IN `p_branch_manager_id` INT)   BEGIN
    DECLARE v_branch_id INT DEFAULT NULL;

    SELECT branch_id INTO v_branch_id FROM inspector_assignment
    WHERE inspector_id = p_inspector_id AND status = 'Active' LIMIT 1;

    UPDATE inspector SET status = 'inactive', termination_date = CURRENT_DATE, termination_reason = p_reason
    WHERE inspector_id = p_inspector_id;

    UPDATE inspector_assignment SET status = 'Inactive', end_date = CURRENT_DATE, remarks = CONCAT('Terminated: ', p_reason)
    WHERE inspector_id = p_inspector_id AND status = 'Active';

    INSERT INTO inspector_action_log (inspector_id, branch_id, branch_manager_id, action_type, action_date, remarks)
    VALUES (p_inspector_id, v_branch_id, p_branch_manager_id, 'Termination', NOW(),
            CONCAT('Inspector ID ', p_inspector_id, ' terminated. Reason: ', p_reason));

    SELECT CONCAT('Inspector ID ', p_inspector_id, ' has been terminated for reason: ', p_reason) AS message;
END$$

DELIMITER ;
