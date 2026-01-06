-- Migration: 131_sp_addStallComplete.sql
-- Description: sp_addStallComplete stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_addStallComplete`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStallComplete` (IN `p_stall_no` VARCHAR(50), IN `p_stall_location` VARCHAR(200), IN `p_size` VARCHAR(50), IN `p_floor_id` INT, IN `p_section_id` INT, IN `p_rental_price` DECIMAL(10,2), IN `p_price_type` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_stamp` VARCHAR(50), IN `p_description` TEXT, IN `p_stall_image` VARCHAR(500), IN `p_is_available` TINYINT, IN `p_raffle_auction_deadline` DATETIME, IN `p_deadline_active` TINYINT, IN `p_raffle_auction_status` VARCHAR(50), IN `p_created_by_manager` INT)   BEGIN
  INSERT INTO stall (
    stall_no, stall_location, size, floor_id, section_id, rental_price, 
    price_type, status, stamp, description, stall_image, is_available, 
    raffle_auction_deadline, deadline_active, raffle_auction_status, created_by_manager, created_at
  ) VALUES (
    p_stall_no, p_stall_location, p_size, p_floor_id, p_section_id, p_rental_price, 
    p_price_type, p_status, p_stamp, p_description, p_stall_image, p_is_available, 
    p_raffle_auction_deadline, p_deadline_active, p_raffle_auction_status, p_created_by_manager, NOW()
  );
  
  SELECT LAST_INSERT_ID() as stall_id;
END$$

DELIMITER ;
