-- Migration: 165_sp_deleteStallImage.sql
-- Description: sp_deleteStallImage stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_deleteStallImage`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_deleteStallImage` (IN `p_image_id` INT)   BEGIN
  DECLARE v_stall_id INT;
  DECLARE v_image_url VARCHAR(255);
  
  
  SELECT stall_id, image_url INTO v_stall_id, v_image_url
  FROM stall_images
  WHERE id = p_image_id;
  
  IF v_stall_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Image not found';
  END IF;
  
  
  DELETE FROM stall_images WHERE id = p_image_id;
  
  
  SELECT v_stall_id AS stall_id, v_image_url AS image_url, p_image_id AS id;
END$$

DELIMITER ;
