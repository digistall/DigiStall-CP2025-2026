-- Migration: 132_sp_addStallImage.sql
-- Description: sp_addStallImage stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_addStallImage`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_addStallImage` (IN `p_stall_id` INT, IN `p_image_url` VARCHAR(500), IN `p_is_primary` TINYINT)   BEGIN
    DECLARE image_count INT DEFAULT 0;
    DECLARE new_display_order INT DEFAULT 1;
    DECLARE should_be_primary TINYINT DEFAULT 0;
    
    
    SELECT COUNT(*) INTO image_count
    FROM stall_images
    WHERE stall_id = p_stall_id;
    
    
    IF image_count >= 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add more than 10 images per stall';
    END IF;
    
    
    SET new_display_order = image_count + 1;
    
    
    
    IF p_is_primary = 1 OR image_count = 0 THEN
        SET should_be_primary = 1;
        
        
        IF should_be_primary = 1 AND image_count > 0 THEN
            UPDATE stall_images 
            SET is_primary = 0 
            WHERE stall_id = p_stall_id;
        END IF;
    ELSE
        SET should_be_primary = 0;
    END IF;
    
    
    INSERT INTO stall_images (stall_id, image_url, is_primary, display_order, created_at)
    VALUES (p_stall_id, p_image_url, should_be_primary, new_display_order, NOW());
    
END$$

DELIMITER ;
