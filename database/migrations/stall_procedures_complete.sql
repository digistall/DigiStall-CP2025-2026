-- ============================================
-- COMPLETE STORED PROCEDURES FOR STALL CRUD
-- These procedures handle ALL business logic including authorization
-- Controllers only need to call these procedures
-- ============================================

DELIMITER $$

-- ============================================
-- 1. ADD STALL - Complete with all validations
-- ============================================
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
    IN p_stall_image VARCHAR(500),
    IN p_is_available TINYINT(1),
    IN p_raffle_auction_deadline DATETIME,
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_branch_id INT,
    OUT p_stall_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
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
            LEAVE;
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
            LEAVE;
        END IF;
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot create stalls');
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE;
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
        LEAVE;
    END IF;

    -- Check for duplicate stall number in the same section
    SELECT COUNT(*) INTO v_existing_stall
    FROM stall
    WHERE stall_no = p_stall_no AND section_id = p_section_id;

    IF v_existing_stall > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Stall number ', p_stall_no, ' already exists in ', v_section_name, ' section on ', v_floor_name);
        SET p_stall_id = NULL;
        ROLLBACK;
        LEAVE;
    END IF;

    -- Insert the stall
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
        stall_image, 
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
        p_stall_image,
        p_is_available,
        p_raffle_auction_deadline,
        0, -- deadline_active starts as false
        CASE 
            WHEN p_price_type IN ('Raffle', 'Auction') THEN 'Not Started'
            ELSE NULL
        END,
        v_business_manager_id,
        NOW()
    );

    SET p_stall_id = LAST_INSERT_ID();
    SET p_success = TRUE;
    
    -- Build success message
    IF p_price_type = 'Raffle' THEN
        SET p_message = CONCAT('Stall ', p_stall_no, ' added successfully to ', v_floor_name, ', ', v_section_name, '. Raffle will start when first applicant applies');
    ELSEIF p_price_type = 'Auction' THEN
        SET p_message = CONCAT('Stall ', p_stall_no, ' added successfully to ', v_floor_name, ', ', v_section_name, '. Auction will start when first bid is placed');
    ELSE
        SET p_message = CONCAT('Stall ', p_stall_no, ' added successfully to ', v_floor_name, ', ', v_section_name);
    END IF;

    -- If it's a raffle, create raffle record
    IF p_price_type = 'Raffle' THEN
        INSERT INTO raffle (
            stall_id, 
            raffle_status, 
            created_by_business_manager, 
            created_at
        ) VALUES (
            p_stall_id, 
            'Waiting for Participants', 
            v_business_manager_id, 
            NOW()
        );
    END IF;

    -- If it's an auction, create auction record
    IF p_price_type = 'Auction' THEN
        INSERT INTO auction (
            stall_id, 
            starting_price, 
            current_highest_bid, 
            auction_status,
            created_by_business_manager, 
            created_at
        ) VALUES (
            p_stall_id, 
            p_rental_price, 
            p_rental_price,
            'Waiting for Bids',
            v_business_manager_id, 
            NOW()
        );
    END IF;

    COMMIT;
END$$

-- ============================================
-- 2. UPDATE STALL - Complete with all validations
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
BEGIN
    DECLARE v_existing_branch_id INT;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE v_duplicate_stall INT DEFAULT 0;
    DECLARE v_business_manager_id INT;
    
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
        LEAVE;
    END IF;

    -- Verify user has permission to update this stall
    IF p_user_type = 'business_manager' THEN
        -- Verify manager owns this branch
        SELECT COUNT(*) INTO v_floor_section_valid
        FROM business_manager
        WHERE business_manager_id = p_user_id AND branch_id = v_existing_branch_id;
        
        IF v_floor_section_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE;
        END IF;
        
        SET v_business_manager_id = p_user_id;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Verify employee's branch matches stall's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE;
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
        LEAVE;
    END IF;

    -- Validate floor and section relationship with the branch
    SELECT COUNT(*) INTO v_floor_section_valid
    FROM section sec
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE sec.section_id = p_section_id 
      AND f.floor_id = p_floor_id 
      AND f.branch_id = v_existing_branch_id;

    IF v_floor_section_valid = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Invalid floor or section for this stall';
        ROLLBACK;
        LEAVE;
    END IF;

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
        LEAVE;
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
-- 3. DELETE STALL - Complete with all validations
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
BEGIN
    DECLARE v_existing_branch_id INT;
    DECLARE v_has_active_subscription INT DEFAULT 0;
    DECLARE v_has_applications INT DEFAULT 0;
    DECLARE v_stall_no VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while deleting stall';
    END;

    START TRANSACTION;

    -- Check if stall exists and get its branch and number
    SELECT f.branch_id, s.stall_no INTO v_existing_branch_id, v_stall_no
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE s.stall_id = p_stall_id;

    IF v_existing_branch_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
        LEAVE;
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
            LEAVE;
        END IF;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Verify employee's branch matches stall's branch
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE;
        END IF;
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot delete stalls');
        ROLLBACK;
        LEAVE;
    END IF;

    -- Check for active subscriptions
    SELECT COUNT(*) INTO v_has_active_subscription
    FROM subscription
    WHERE stall_id = p_stall_id AND status = 'Active';

    IF v_has_active_subscription > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Active subscriptions exist');
        ROLLBACK;
        LEAVE;
    END IF;

    -- Check for pending applications
    SELECT COUNT(*) INTO v_has_applications
    FROM application
    WHERE stall_id = p_stall_id AND status IN ('Pending', 'Under Review');

    IF v_has_applications > 0 THEN
        SET p_success = FALSE;
        SET p_message = CONCAT('Cannot delete stall ', v_stall_no, '. Pending applications exist');
        ROLLBACK;
        LEAVE;
    END IF;

    -- Delete the stall (cascading will handle related records)
    DELETE FROM stall WHERE stall_id = p_stall_id;

    SET p_success = TRUE;
    SET p_message = CONCAT('Stall ', v_stall_no, ' deleted successfully');

    COMMIT;
END$$

-- ============================================
-- 4. GET ALL STALLS - Complete with authorization
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getAllStalls_complete`$$

CREATE PROCEDURE `sp_getAllStalls_complete`(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_branch_id INT
)
BEGIN
    IF p_user_type = 'business_manager' THEN
        -- Get stalls for the manager's branch
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            s.stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        INNER JOIN business_manager bm ON b.branch_id = bm.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        WHERE bm.business_manager_id = p_user_id
        ORDER BY s.created_at DESC;
        
    ELSEIF p_user_type = 'business_employee' THEN
        -- Get stalls for the employee's branch
        SELECT 
            s.stall_id,
            s.stall_no,
            s.stall_location,
            s.size,
            s.floor_id,
            f.floor_name,
            s.section_id,
            sec.section_name,
            s.rental_price,
            s.price_type,
            s.status,
            s.stamp,
            s.description,
            s.stall_image,
            s.is_available,
            s.raffle_auction_deadline,
            s.deadline_active,
            s.raffle_auction_status,
            s.created_by_business_manager,
            s.created_at,
            s.updated_at,
            b.branch_id,
            b.branch_name,
            b.area,
            CASE 
                WHEN sh.stall_id IS NOT NULL THEN 'Occupied'
                WHEN s.is_available = 1 THEN 'Available'
                ELSE 'Unavailable'
            END as availability_status,
            sh.stallholder_id,
            sh.stallholder_name
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status = 'Active'
        WHERE b.branch_id = p_branch_id
        ORDER BY s.created_at DESC;
        
    ELSE
        -- Return empty result for unauthorized user types
        SELECT NULL LIMIT 0;
    END IF;
END$$

-- ============================================
-- 5. GET STALL BY ID - Complete with authorization
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getStallById_complete`$$

CREATE PROCEDURE `sp_getStallById_complete`(
    IN p_stall_id INT,
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_branch_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_stall_branch_id INT;
    
    -- Get the branch ID of the requested stall
    SELECT f.branch_id INTO v_stall_branch_id
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    WHERE s.stall_id = p_stall_id;
    
    IF v_stall_branch_id IS NULL THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        SELECT NULL LIMIT 0;
        LEAVE;
    END IF;
    
    -- Verify authorization
    IF p_user_type = 'business_manager' THEN
        IF NOT EXISTS (
            SELECT 1 FROM business_manager 
            WHERE business_manager_id = p_user_id AND branch_id = v_stall_branch_id
        ) THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            SELECT NULL LIMIT 0;
            LEAVE;
        END IF;
    ELSEIF p_user_type = 'business_employee' THEN
        IF p_branch_id != v_stall_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            SELECT NULL LIMIT 0;
            LEAVE;
        END IF;
    ELSE
        SET p_success = FALSE;
        SET p_message = CONCAT('Access denied. User type ', p_user_type, ' cannot view stalls');
        SELECT NULL LIMIT 0;
        LEAVE;
    END IF;
    
    -- Return the stall data
    SET p_success = TRUE;
    SET p_message = 'Stall retrieved successfully';
    
    SELECT 
        s.stall_id,
        s.stall_no,
        s.stall_location,
        s.size,
        s.floor_id,
        f.floor_name,
        f.floor_number,
        s.section_id,
        sec.section_name,
        s.rental_price,
        s.price_type,
        s.status,
        s.stamp,
        s.description,
        s.stall_image,
        s.is_available,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location as branch_location
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE s.stall_id = p_stall_id;
END$$

DELIMITER ;
