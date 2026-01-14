-- Migration: 164_sp_deleteStall.sql
-- Description: sp_deleteStall stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_deleteStall`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteStall` (IN `p_stall_id` INT, IN `p_deleted_by_business_manager` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   BEGIN
    DECLARE v_stall_exists INT DEFAULT 0;
    DECLARE v_has_active_applications INT DEFAULT 0;
    DECLARE v_has_stallholder INT DEFAULT 0;
    DECLARE v_stall_no VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while deleting stall';
    END;

    START TRANSACTION;

    -- Check if stall exists and get stall number
    SELECT COUNT(*), stall_no INTO v_stall_exists, v_stall_no
    FROM stall
    WHERE stall_id = p_stall_id;

    IF v_stall_exists = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
    ELSE
        -- Check for active applications
        SELECT COUNT(*) INTO v_has_active_applications
        FROM application
        WHERE stall_id = p_stall_id 
        AND application_status IN ('Pending', 'Under Review', 'Approved');

        IF v_has_active_applications > 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Cannot delete stall with active applications';
            ROLLBACK;
        ELSE
            -- Check for active stallholders
            SELECT COUNT(*) INTO v_has_stallholder
            FROM stallholder
            WHERE stall_id = p_stall_id 
            AND contract_status = 'Active';

            IF v_has_stallholder > 0 THEN
                SET p_success = FALSE;
                SET p_message = 'Cannot delete stall with active stallholder';
                ROLLBACK;
            ELSE
                -- Delete related raffle records
                DELETE FROM raffle WHERE stall_id = p_stall_id;
                
                -- Delete related auction records
                DELETE FROM auction WHERE stall_id = p_stall_id;
                
                -- Delete the stall
                DELETE FROM stall WHERE stall_id = p_stall_id;
                
                SET p_success = TRUE;
                SET p_message = CONCAT('Stall ', v_stall_no, ' deleted successfully');
                COMMIT;
            END IF;
        END IF;
    END IF;
END$$

DELIMITER ;
