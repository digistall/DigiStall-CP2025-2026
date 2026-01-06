-- Migration: 224_sp_setStallPrimaryImage.sql
-- Description: sp_setStallPrimaryImage stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_setStallPrimaryImage`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_setStallPrimaryImage` (IN `p_image_id` INT)   BEGIN
    DECLARE v_stall_id INT;
    
    
    SELECT stall_id INTO v_stall_id 
    FROM stall_images 
    WHERE id = p_image_id;
    
    IF v_stall_id IS NOT NULL THEN
        
        UPDATE stall_images 
        SET is_primary = 0 
        WHERE stall_id = v_stall_id;
        
        
        UPDATE stall_images 
        SET is_primary = 1 
        WHERE id = p_image_id;
    END IF;
END$$

DELIMITER ;
