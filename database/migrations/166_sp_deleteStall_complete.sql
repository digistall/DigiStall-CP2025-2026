-- Migration: 166_sp_deleteStall_complete.sql
-- Description: sp_deleteStall_complete stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_deleteStall_complete`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteStall_complete` (IN `p_stall_id` INT, IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   proc_label: BEGIN
    DECLARE v_existing_branch_id INT DEFAULT NULL;
    DECLARE v_has_active_subscription INT DEFAULT 0;
    DECLARE v_has_applications INT DEFAULT 0;
    DECLARE v_stall_no VARCHAR(20) DEFAULT NULL;
    DECLARE v_floor_id INT DEFAULT NULL;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        GET DIAGNOSTICS CONDITION 1
            @sqlstate = RETURNED_SQLSTATE, 
            @errno = MYSQL_ERRNO, 
            @text = MESSAGE_TEXT;
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = CONCAT('Database error: ', @text);
    END;

    START TRANSACTION;

    -- Check if stall exists first
    SELECT s.stall_no, s.section_id INTO v_stall_no, v_floor_id
    FROM stall s
    WHERE s.stall_id = p_stall_id;

    IF v_stall_no IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Get branch_id from section and floor
    SELECT f.branch_id INTO v_existing_branch_id
    FROM section sec
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE sec.section_id = v_floor_id;

    IF v_existing_branch_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Verify user has permission to delete this stall
    IF p_user_type = 'business_manager' THEN
        -- Verify manager owns this branch
        IF NOT EXISTS (
            SELECT 1 FROM business_manager 
            WHERE business_manager_id = p_user_id AND branch_id = v_existing_branch_id
        ) THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Verify employee's branch matches stall's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot delete stalls');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for any applications (not just pending)
    SELECT COUNT(*) INTO v_has_applications
    FROM application
    WHERE stall_id = p_stall_id;

    IF v_has_applications > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Application records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for stallholders
    IF EXISTS (SELECT 1 FROM stallholder WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Stallholder records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for auction records
    IF EXISTS (SELECT 1 FROM auction WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Auction records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for raffle records
    IF EXISTS (SELECT 1 FROM raffle WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Raffle records exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for violation reports
    IF EXISTS (SELECT 1 FROM violation_report WHERE stall_id = p_stall_id) THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Violation reports exist. Archive stall instead of deleting');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- If no related records exist, safe to delete
    DELETE FROM stall WHERE stall_id = p_stall_id;

    SET p_success = TRUE;
    SET p_message = CONCAT('Stall ', v_stall_no, ' deleted successfully');

    COMMIT;
END$$

DELIMITER ;
