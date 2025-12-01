-- ============================================
-- STORED PROCEDURES FOR STALL OPERATIONS
-- Created: December 1, 2025
-- Purpose: Add, Update, Delete, and Display stalls
-- ============================================

DELIMITER $$

-- ============================================
-- 1. ADD STALL PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS `sp_addStall`$$

CREATE PROCEDURE `sp_addStall`(
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
    IN p_created_by_business_manager INT,
    OUT p_stall_id INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_existing_stall INT DEFAULT 0;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while adding stall';
        SET p_stall_id = NULL;
    END;

    START TRANSACTION;

    -- Validate floor and section relationship
    SELECT COUNT(*) INTO v_floor_section_valid
    FROM section s
    INNER JOIN floor f ON s.floor_id = f.floor_id
    WHERE s.section_id = p_section_id AND f.floor_id = p_floor_id;

    IF v_floor_section_valid = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Invalid floor and section combination';
        SET p_stall_id = NULL;
        ROLLBACK;
    ELSE
        -- Check for duplicate stall number in the same section
        SELECT COUNT(*) INTO v_existing_stall
        FROM stall
        WHERE stall_no = p_stall_no AND section_id = p_section_id;

        IF v_existing_stall > 0 THEN
            SET p_success = FALSE;
            SET p_message = CONCAT('Stall number ', p_stall_no, ' already exists in this section');
            SET p_stall_id = NULL;
            ROLLBACK;
        ELSE
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
                    ELSE 'Not Started'
                END,
                p_created_by_business_manager,
                NOW()
            );

            SET p_stall_id = LAST_INSERT_ID();
            SET p_success = TRUE;
            SET p_message = CONCAT('Stall ', p_stall_no, ' added successfully');

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
                    p_created_by_business_manager, 
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
                    p_created_by_business_manager, 
                    NOW()
                );
            END IF;

            COMMIT;
        END IF;
    END IF;
END$$

-- ============================================
-- 2. UPDATE STALL PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS `sp_updateStall`$$

CREATE PROCEDURE `sp_updateStall`(
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
    IN p_updated_by_business_manager INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
    DECLARE v_stall_exists INT DEFAULT 0;
    DECLARE v_duplicate_stall INT DEFAULT 0;
    DECLARE v_floor_section_valid INT DEFAULT 0;
    DECLARE v_current_price_type VARCHAR(20);
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_success = FALSE;
        SET p_message = 'Database error occurred while updating stall';
    END;

    START TRANSACTION;

    -- Check if stall exists
    SELECT COUNT(*), price_type INTO v_stall_exists, v_current_price_type
    FROM stall
    WHERE stall_id = p_stall_id;

    IF v_stall_exists = 0 THEN
        SET p_success = FALSE;
        SET p_message = 'Stall not found';
        ROLLBACK;
    ELSE
        -- Validate floor and section relationship
        SELECT COUNT(*) INTO v_floor_section_valid
        FROM section s
        INNER JOIN floor f ON s.floor_id = f.floor_id
        WHERE s.section_id = p_section_id AND f.floor_id = p_floor_id;

        IF v_floor_section_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Invalid floor and section combination';
            ROLLBACK;
        ELSE
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
            ELSE
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

                -- Handle price type changes
                IF v_current_price_type != p_price_type THEN
                    -- If changing to Raffle, ensure raffle record exists
                    IF p_price_type = 'Raffle' THEN
                        INSERT IGNORE INTO raffle (
                            stall_id, 
                            raffle_status, 
                            created_by_business_manager, 
                            created_at
                        ) VALUES (
                            p_stall_id, 
                            'Waiting for Participants', 
                            p_updated_by_business_manager, 
                            NOW()
                        );
                    END IF;

                    -- If changing to Auction, ensure auction record exists
                    IF p_price_type = 'Auction' THEN
                        INSERT IGNORE INTO auction (
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
                            p_updated_by_business_manager, 
                            NOW()
                        );
                    END IF;
                END IF;

                SET p_success = TRUE;
                SET p_message = CONCAT('Stall ', p_stall_no, ' updated successfully');
                COMMIT;
            END IF;
        END IF;
    END IF;
END$$

-- ============================================
-- 3. DELETE STALL PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS `sp_deleteStall`$$

CREATE PROCEDURE `sp_deleteStall`(
    IN p_stall_id INT,
    IN p_deleted_by_business_manager INT,
    OUT p_success BOOLEAN,
    OUT p_message VARCHAR(500)
)
BEGIN
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

-- ============================================
-- 4. GET STALL BY ID PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getStallById`$$

CREATE PROCEDURE `sp_getStallById`(
    IN p_stall_id INT
)
BEGIN
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
        s.raffle_auction_start_time,
        s.raffle_auction_end_time,
        s.created_by_business_manager,
        s.created_at,
        s.updated_at,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location,
        bm.first_name as manager_first_name,
        bm.last_name as manager_last_name
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    LEFT JOIN business_manager bm ON s.created_by_business_manager = bm.business_manager_id
    WHERE s.stall_id = p_stall_id;
END$$

-- ============================================
-- 5. GET ALL STALLS BY BRANCH PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getAllStallsByBranch`$$

CREATE PROCEDURE `sp_getAllStallsByBranch`(
    IN p_branch_id INT
)
BEGIN
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
    ORDER BY s.stall_no ASC;
END$$

-- ============================================
-- 6. GET ALL STALLS BY BUSINESS MANAGER PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getAllStallsByManager`$$

CREATE PROCEDURE `sp_getAllStallsByManager`(
    IN p_business_manager_id INT
)
BEGIN
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
    WHERE bm.business_manager_id = p_business_manager_id
    ORDER BY s.stall_no ASC;
END$$

-- ============================================
-- 7. GET AVAILABLE STALLS BY BRANCH PROCEDURE
-- ============================================
DROP PROCEDURE IF EXISTS `sp_getAvailableStallsByBranch`$$

CREATE PROCEDURE `sp_getAvailableStallsByBranch`(
    IN p_branch_id INT
)
BEGIN
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
        s.description,
        s.stall_image,
        s.raffle_auction_deadline,
        s.deadline_active,
        s.raffle_auction_status,
        b.branch_id,
        b.branch_name,
        b.area,
        b.location
    FROM stall s
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON s.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    WHERE b.branch_id = p_branch_id
    AND s.is_available = 1
    AND s.status = 'Active'
    AND s.stall_id NOT IN (
        SELECT stall_id FROM stallholder WHERE contract_status = 'Active'
    )
    ORDER BY s.stall_no ASC;
END$$

DELIMITER ;

-- ============================================
-- USAGE EXAMPLES
-- ============================================

-- Example 1: Add a new stall
-- CALL sp_addStall(
--     'NPM-999',                    -- stall_no
--     'Main Entrance',              -- stall_location
--     '3x4',                        -- size
--     1,                            -- floor_id
--     1,                            -- section_id
--     2500.00,                      -- rental_price
--     'Fixed Price',                -- price_type
--     'Active',                     -- status
--     'APPROVED',                   -- stamp
--     'Test stall description',     -- description
--     NULL,                         -- stall_image
--     1,                            -- is_available
--     NULL,                         -- raffle_auction_deadline
--     1,                            -- created_by_business_manager
--     @stall_id,                    -- OUT p_stall_id
--     @success,                     -- OUT p_success
--     @message                      -- OUT p_message
-- );
-- SELECT @stall_id, @success, @message;

-- Example 2: Update a stall
-- CALL sp_updateStall(
--     50,                           -- stall_id
--     'NPM-001-UPDATED',            -- stall_no
--     'Updated Location',           -- stall_location
--     '4x4',                        -- size
--     1,                            -- floor_id
--     1,                            -- section_id
--     3000.00,                      -- rental_price
--     'Fixed Price',                -- price_type
--     'Active',                     -- status
--     'Updated description',        -- description
--     NULL,                         -- stall_image
--     1,                            -- is_available
--     NULL,                         -- raffle_auction_deadline
--     1,                            -- updated_by_business_manager
--     @success,                     -- OUT p_success
--     @message                      -- OUT p_message
-- );
-- SELECT @success, @message;

-- Example 3: Delete a stall
-- CALL sp_deleteStall(
--     999,                          -- stall_id
--     1,                            -- deleted_by_business_manager
--     @success,                     -- OUT p_success
--     @message                      -- OUT p_message
-- );
-- SELECT @success, @message;

-- Example 4: Get stall by ID
-- CALL sp_getStallById(50);

-- Example 5: Get all stalls by branch
-- CALL sp_getAllStallsByBranch(1);

-- Example 6: Get all stalls by business manager
-- CALL sp_getAllStallsByManager(1);

-- Example 7: Get available stalls by branch
-- CALL sp_getAvailableStallsByBranch(1);
