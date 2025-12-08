-- ============================================
-- FIX sp_addStall_complete - Remove stall_image column
-- This fixes the error when adding stalls after stall_image column was removed
-- ============================================

USE naga_stall;

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_addStall_complete`$$

CREATE PROCEDURE `sp_addStall_complete`(
    IN p_stall_no VARCHAR(20),
    IN p_stall_location VARCHAR(100),
    IN p_size VARCHAR(50),
    IN p_floor_id INT,
    IN p_section_id INT,
    IN p_rental_price DECIMAL(10,2),
    IN p_price_type ENUM('Fixed Price','Auction','Raffle'),
    IN p_status ENUM('Active','Inactive','Maintenance','Occupied'),
    IN p_stamp VARCHAR(100),
    IN p_description TEXT,
    IN p_stall_image VARCHAR(500),  -- Keep parameter for backward compatibility but don't use it
    IN p_is_available TINYINT(1),
    IN p_raffle_auction_deadline DATETIME,
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_branch_id INT,
    OUT p_stall_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
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

    -- Determine the business manager ID based on user type
    IF p_user_type = 'business_manager' THEN
        SET v_business_manager_id = p_user_id;
        
        -- Verify manager belongs to the branch
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
        -- Get the manager ID for the employee's branch
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

    -- Validate floor and section belong to the user's branch
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

    -- Check if stall number already exists in the same section
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

    -- Insert new stall (WITHOUT stall_image column)
    INSERT INTO stall (
        stall_no, 
        stall_location, 
        size, 
        floor_id, 
        section_id, 
        rental_price,
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
        p_price_type,
        p_status,
        p_stamp,
        p_description,
        p_is_available,
        p_raffle_auction_deadline,
        0, -- deadline_active
        CASE 
            WHEN p_price_type IN ('Raffle', 'Auction') THEN 'Not Started'
            ELSE NULL
        END,
        v_business_manager_id,
        NOW()
    );

    -- Get the newly created stall_id
    SET p_stall_id = LAST_INSERT_ID();
    
    -- Success
    SET p_success = TRUE;
    SET p_message = CONCAT('Stall ', p_stall_no, ' created successfully in ', v_section_name, ' section on ', v_floor_name);

    COMMIT;
END$$

DELIMITER ;

SELECT 'sp_addStall_complete procedure updated successfully - stall_image column removed from INSERT' as Status;
