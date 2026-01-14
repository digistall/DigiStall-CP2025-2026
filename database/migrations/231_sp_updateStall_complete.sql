-- Migration: 231_sp_updateStall_complete.sql
-- Description: sp_updateStall_complete stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_updateStall_complete`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_updateStall_complete` (IN `p_stall_id` INT, IN `p_stall_no` VARCHAR(20), IN `p_stall_location` VARCHAR(100), IN `p_size` VARCHAR(50), IN `p_floor_id` INT, IN `p_section_id` INT, IN `p_rental_price` DECIMAL(10,2), IN `p_price_type` ENUM('Fixed Price','Auction','Raffle'), IN `p_status` ENUM('Active','Inactive','Maintenance','Occupied'), IN `p_description` TEXT, IN `p_stall_image` VARCHAR(500), IN `p_is_available` TINYINT(1), IN `p_raffle_auction_deadline` DATETIME, IN `p_user_id` INT, IN `p_user_type` VARCHAR(50), IN `p_branch_id` INT, OUT `p_success` BOOLEAN, OUT `p_message` VARCHAR(500))   proc_label: BEGIN
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

    
    IF p_user_type = 'business_manager' THEN
        
        SELECT COUNT(*) INTO v_floor_section_valid
        FROM business_manager
        WHERE business_manager_id = p_user_id AND branch_id = p_branch_id;
        
        IF v_floor_section_valid = 0 THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. You do not manage this branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        SET v_business_manager_id = p_user_id;
        
    ELSEIF p_user_type = 'business_employee' THEN
        
        IF p_branch_id != v_existing_branch_id THEN
            SET p_success = FALSE;
            SET p_message = 'Access denied. Stall does not belong to your branch';
            ROLLBACK;
            LEAVE proc_label;
        END IF;
        
        
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
    
    
    SET p_floor_id = v_correct_floor_id;

    
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
        is_available = p_is_available,
        raffle_auction_deadline = p_raffle_auction_deadline,
        updated_at = NOW()
    WHERE stall_id = p_stall_id;

    SET p_success = TRUE;
    SET p_message = 'Stall updated successfully';

    COMMIT;
END$$

DELIMITER ;
