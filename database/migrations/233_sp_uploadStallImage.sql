-- Migration: 233_sp_uploadStallImage.sql
-- Description: sp_uploadStallImage stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_uploadStallImage`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_uploadStallImage` (IN `p_stall_id` INT, IN `p_image_path` VARCHAR(500), IN `p_updated_by` INT)   BEGIN
    DECLARE v_exists INT DEFAULT 0;
    
    SELECT COUNT(*) INTO v_exists FROM stall WHERE stall_id = p_stall_id;
    
    IF v_exists = 0 THEN
        SELECT 0 as success, 'Stall not found' as message;
    ELSE
        UPDATE stall 
        SET stall_image = p_image_path,
            updated_at = NOW()
        WHERE stall_id = p_stall_id;
        
        SELECT 1 as success, 
               'Stall image uploaded successfully' as message,
               p_stall_id as stall_id,
               p_image_path as image_path;
    END IF;
END$$

DELIMITER ;
