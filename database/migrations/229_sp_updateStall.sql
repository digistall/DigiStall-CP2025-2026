-- Migration: 229_sp_updateStall.sql
-- Description: sp_updateStall stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_updateStall`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateStall` (IN `p_stall_id` INT, IN `p_stall_no` VARCHAR(20), IN `p_stall_location` VARCHAR(100), IN `p_size` VARCHAR(50), IN `p_floor_id` INT, IN `p_section_id` INT, IN `p_rental_price` DECIMAL(10,2), IN `p_price_type` ENUM('Fixed Price','Auction','Raffle'), IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), IN `p_description` TEXT, IN `p_stall_image` VARCHAR(500), IN `p_is_available` TINYINT(1), IN `p_raffle_auction_deadline` DATETIME, IN `p_updated_by_business_manager` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   BEGIN
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

DELIMITER ;
