-- Migration: 300_update_stall_procedures_with_rental_fields.sql
-- Description: Update sp_addStall_complete and sp_updateStall_complete to include area_sqm, base_rate, rate_per_sqm
-- Date: 2024-12-22

DELIMITER $$

-- Drop and recreate sp_addStall_complete with new rental calculation fields
DROP PROCEDURE IF EXISTS `sp_addStall_complete`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStall_complete` (
    IN `p_stall_no` VARCHAR(20), 
    IN `p_stall_location` VARCHAR(100), 
    IN `p_size` VARCHAR(50), 
    IN `p_floor_id` INT, 
    IN `p_section_id` INT, 
    IN `p_rental_price` DECIMAL(10,2), 
    IN `p_base_rate` DECIMAL(10,2),
    IN `p_area_sqm` DECIMAL(8,2),
    IN `p_rate_per_sqm` DECIMAL(10,2),
    IN `p_price_type` ENUM('Fixed Price','Auction','Raffle'), 
    IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), 
    IN `p_stamp` VARCHAR(100), 
    IN `p_description` TEXT, 
    IN `p_stall_image` VARCHAR(500), 
    IN `p_is_available` TINYINT(1), 
    IN `p_raffle_auction_deadline` DATETIME, 
    IN `p_user_id` INT, 
    IN `p_user_type` VARCHAR(50), 
    IN `p_branch_id` INT, 
    OUT `p_stall_id` INT, 
    OUT `p_success` BOOLEAN, 
    OUT `p_message` VARCHAR(500)
)
proc_label: BEGIN
    DECLARE v_existing_stall INT DEFAULT 0;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE v_branch_valid INT DEFAULT 0;
    DECLARE v_business_manager_id INT DEFAULT NULL;
    DECLARE v_floor_name VARCHAR(100);
    DECLARE v_section_name VARCHAR(100);
    DECLARE v_branch_name VARCHAR(100);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while adding stall';
        SET p_stall_id = NULL;
    END;

    START TRANSACTION;

    -- Check user authorization
    IF p_user_type = 'business_manager' THEN
        SET v_business_manager_id = p_user_id;
        
        -- Verify manager belongs to this branch
        SELECT COUNT(*) INTO v_branch_valid
        FROM business_manager
        WHERE business_manager_id = p_user_id AND branch_id = p_branch_id;
        
        IF v_branch_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Manager does not belong to this branch';
            SET p_stall_id = NULL;
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Get the manager for this branch
        SELECT bm.business_manager_id INTO v_business_manager_id
        FROM branch b
        LEFT JOIN business_manager bm ON b.branch_id = bm.branch_id
        WHERE b.branch_id = p_branch_id
        LIMIT 1;
        
        IF v_business_manager_id IS NULL THEN
            SET p_success = FALSE;
            SET p_message = 'Branch does not have an assigned manager';
            SET p_stall_id = NULL;
            ROLLBACK;
            LEAVE proc_label;
        END IF;
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot create stalls');
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Validate floor and section belong to the branch
    SELECT COUNT(*), MAX(f.floor_name), MAX(sec.section_name), MAX(b.branch_name)
    INTO v_floor_section_valid, v_floor_name, v_section_name, v_branch_name
    FROM section sec
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE sec.section_id = p_section_id 
      AND f.floor_id = p_floor_id 
      AND b.branch_id = p_branch_id;

    IF v_floor_section_valid = 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Invalid floor (', p_floor_id, ') or section (', p_section_id, ') for your branch');
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Check for duplicate stall number in section
    SELECT COUNT(*) INTO v_existing_stall
    FROM stall
    WHERE stall_no = p_stall_no AND section_id = p_section_id;

    IF v_existing_stall > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Stall number ', p_stall_no, ' already exists in ', v_section_name, ' section on ', v_floor_name);
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE proc_label;
    END IF;

    -- Insert the stall with new rental calculation fields
    INSERT INTO stall (
        stall_no, 
        stall_location, 
        size, 
        floor_id, 
        section_id, 
        rental_price,
        base_rate,
        area_sqm,
        rate_per_sqm,
        price_type, 
        status, 
        stamp, 
        description, 
        is_available,
        raffle_auction_deadline,
        deadline_active,
        raffle_auction_status,
        created_by_business_manager,
        created_at
    ) VALUES (
        p_stall_no,
        p_stall_location,
        p_size,
        p_floor_id,
        p_section_id,
        p_rental_price,
        p_base_rate,
        p_area_sqm,
        p_rate_per_sqm,
        p_price_type,
        p_status,
        p_stamp,
        p_description,
        p_is_available,
        p_raffle_auction_deadline,
        0, 
        CASE 
            WHEN p_price_type IN ('Raffle', 'Auction') THEN 'Not Started'
            ELSE NULL
        END,
        v_business_manager_id,
        NOW()
    );

    -- Get the new stall ID
    SET p_stall_id = LAST_INSERT_ID();
    
    SET p_success = TRUE;
    SET p_message = CONCAT('Stall ', p_stall_no, ' created successfully in ', v_section_name, ' section on ', v_floor_name);

    COMMIT;
END$$


-- Drop and recreate sp_updateStall_complete with new rental calculation fields
DROP PROCEDURE IF EXISTS `sp_updateStall_complete`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateStall_complete` (
    IN `p_stall_id` INT, 
    IN `p_stall_no` VARCHAR(20), 
    IN `p_stall_location` VARCHAR(100), 
    IN `p_size` VARCHAR(50), 
    IN `p_floor_id` INT, 
    IN `p_section_id` INT, 
    IN `p_rental_price` DECIMAL(10,2), 
    IN `p_base_rate` DECIMAL(10,2),
    IN `p_area_sqm` DECIMAL(8,2),
    IN `p_rate_per_sqm` DECIMAL(10,2),
    IN `p_price_type` ENUM('Fixed Price','Auction','Raffle'), 
    IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), 
    IN `p_description` TEXT, 
    IN `p_stall_image` VARCHAR(500), 
    IN `p_is_available` TINYINT(1), 
    IN `p_raffle_auction_deadline` DATETIME, 
    IN `p_user_id` INT, 
    IN `p_user_type` VARCHAR(50), 
    IN `p_branch_id` INT, 
    OUT `p_success` BOOLEAN, 
    OUT `p_message` VARCHAR(500)
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

    -- Get the branch the stall belongs to
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

    -- Authorization check
    IF p_user_type = 'business_manager' THEN
        -- Verify manager belongs to this branch
        SELECT COUNT(*) INTO v_floor_section_valid
        FROM business_manager
        WHERE business_manager_id = p_user_id AND branch_id = p_branch_id;
        
        IF v_floor_section_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. You do not manage this branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        -- Verify stall belongs to manager's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        SET v_business_manager_id = p_user_id;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Verify stall belongs to employee's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        -- Get manager for this branch
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

    -- Get correct floor_id for the section
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
    
    -- Use the correct floor_id
    SET p_floor_id = v_correct_floor_id;

    -- Check for duplicate stall number
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

    -- Update the stall with new rental calculation fields
    UPDATE stall SET
        stall_no = p_stall_no,
        stall_location = p_stall_location,
        size = p_size,
        floor_id = p_floor_id,
        section_id = p_section_id,
        rental_price = p_rental_price,
        base_rate = p_base_rate,
        area_sqm = p_area_sqm,
        rate_per_sqm = p_rate_per_sqm,
        price_type = p_price_type,
        status = p_status,
        description = p_description,
        is_available = p_is_available,
        raffle_auction_deadline = p_raffle_auction_deadline,
        updated_at = NOW()
    WHERE stall_id = p_stall_id;

    SET p_success = TRUE;
    SET p_message = 'Stall updated successfully';

    COMMIT;
END$$

DELIMITER ;
