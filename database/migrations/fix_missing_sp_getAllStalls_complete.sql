-- Fix for missing stored procedures
-- These procedures are required by the backend API endpoints

USE naga_stall;

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

    -- Check for duplicate stall number in the same section
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
-- 2. GET ALL STALLS - Complete with authorization
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

DELIMITER ;

SELECT 'All stored procedures created successfully!' as Result;
SELECT 'sp_addStall_complete - Added' as ProcedureName;
SELECT 'sp_getAllStalls_complete - Added' as ProcedureName;
