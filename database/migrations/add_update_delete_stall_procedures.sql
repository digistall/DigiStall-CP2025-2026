-- Add missing UPDATE and DELETE stored procedures for stalls
USE naga_stall;

DELIMITER $$

-- ============================================
-- UPDATE STALL - Complete with all validations
-- ============================================
DROP PROCEDURE IF EXISTS `sp_updateStall_complete`$$

CREATE PROCEDURE `sp_updateStall_complete`(
    IN p_stall_id INT,
    IN p_stall_no VARCHAR(20),
    IN p_stall_location VARCHAR(100),
    IN p_size VARCHAR(50),
    IN p_floor_id INT,
    IN p_section_id INT,
    IN p_rental_price DECIMAL(10,2),
    IN p_price_type ENUM('Fixed Price','Auction','Raffle'),
    IN p_status ENUM('Active','Inactive','Maintenance','Occupied'),
    IN p_description TEXT,
    IN p_stall_image VARCHAR(500),
    IN p_is_available TINYINT(1),
    IN p_raffle_auction_deadline DATETIME,
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_branch_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
proc_label: BEGIN
    DECLARE v_existing_branch_id INT;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE v_duplicate_stall INT DEFAULT 0;
    DECLARE v_business_manager_id INT;
    DECLARE v_correct_floor_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while updating stall';
    END;

    START TRANSACTION;

    -- Check if stall exists and get its branch
    SELECT f.branch_id INTO v_existing_branch_id
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE s.stall_id = p_stall_id;

    IF v_existing_branch_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Verify user has permission to update this stall
    IF p_user_type = 'business_manager' THEN
        -- Verify manager owns this branch
        SELECT COUNT(*) INTO v_floor_section_valid
        FROM business_manager
        WHERE business_manager_id = p_user_id AND branch_id = p_branch_id;
        
        IF v_floor_section_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. You do not manage this branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        -- Verify the stall belongs to the manager's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        SET v_business_manager_id = p_user_id;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Verify employee's branch matches stall's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        -- Get the manager ID for the branch
        SELECT business_manager_id INTO v_business_manager_id
        FROM business_manager
        WHERE branch_id = p_branch_id
        LIMIT 1;
        
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot update stalls');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Validate section exists and belongs to the user's branch
    -- Also get the correct floor_id from the section
    SELECT f.floor_id INTO v_correct_floor_id
    FROM section sec
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE sec.section_id = p_section_id 
      AND f.branch_id = p_branch_id;

    IF v_correct_floor_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Invalid section for this branch';
        ROLLBACK;
        LEAVE proc_label;
    END IF;
    
    -- Override the provided floor_id with the section's floor_id
    SET p_floor_id = v_correct_floor_id;

    -- Check for duplicate stall number (excluding current stall)
    SELECT COUNT(*) INTO v_duplicate_stall
    FROM stall
    WHERE stall_no = p_stall_no 
      AND section_id = p_section_id 
      AND stall_id != p_stall_id;

    IF v_duplicate_stall > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Stall number ', p_stall_no, ' already exists in this section');
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Update the stall
    UPDATE stall SET
        stall_no = p_stall_no,
        stall_location = p_stall_location,
        size = p_size,
        floor_id = p_floor_id,
        section_id = p_section_id,
        rental_price = p_rental_price,
        price_type = p_price_type,
        status = p_status,
        description = p_description,
        stall_image = p_stall_image,
        is_available = p_is_available,
        raffle_auction_deadline = p_raffle_auction_deadline,
        updated_at = NOW()
    WHERE stall_id = p_stall_id;

    SET p_success = TRUE;
    SET p_message = 'Stall updated successfully';

    COMMIT;
END$$

-- ============================================
-- DELETE STALL - Complete with all validations
-- ============================================
DROP PROCEDURE IF EXISTS `sp_deleteStall_complete`$$

CREATE PROCEDURE `sp_deleteStall_complete`(
    IN p_stall_id INT,
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_branch_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
proc_label: BEGIN
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

SELECT 'Update and Delete stored procedures created successfully!' as Result;
