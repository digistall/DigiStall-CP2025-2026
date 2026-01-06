-- Migration: 130_sp_addStall.sql
-- Description: sp_addStall stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_addStall`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStall` (IN `p_stall_no` VARCHAR(50), IN `p_rental_price` DECIMAL(10,2), IN `p_size` VARCHAR(50), IN `p_stall_location` VARCHAR(200), IN `p_stall_type` VARCHAR(100), IN `p_section_id` INT, IN `p_stall_image` VARCHAR(500), IN `p_stall_description` TEXT, IN `p_raffle_auction_status` VARCHAR(50), IN `p_auction_type` VARCHAR(50), IN `p_status` VARCHAR(50), IN `p_is_available` TINYINT)   BEGIN
  INSERT INTO stall (
    stall_no, rental_price, size, stall_location, stall_type, section_id,
    stall_image, stall_description, raffle_auction_status, auction_type,
    status, is_available, created_at, updated_at
  ) VALUES (
    p_stall_no, p_rental_price, p_size, p_stall_location, p_stall_type, p_section_id,
    p_stall_image, p_stall_description, p_raffle_auction_status, p_auction_type,
    p_status, p_is_available, NOW(), NOW()
  );
  
  SELECT LAST_INSERT_ID() as stall_id;
END$$

DELIMITER ;
