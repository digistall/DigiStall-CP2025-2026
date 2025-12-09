-- Migration: 214_sp_getStallImages.sql
-- Description: sp_getStallImages stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `sp_getStallImages`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `sp_getStallImages` (IN `p_stall_id` INT)   BEGIN
  SELECT 
    id,
    stall_id,
    image_url,
    display_order,
    is_primary,
    created_at,
    updated_at
  FROM stall_images
  WHERE stall_id = p_stall_id
  ORDER BY is_primary DESC, display_order ASC;
END$$

DELIMITER ;
