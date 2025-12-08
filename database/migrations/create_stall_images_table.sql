-- =============================================
-- STALL IMAGES TABLE MIGRATION
-- =============================================
-- Description: Creates table to support multiple images per stall (up to 10 images)
-- Purpose: Replace single image URL with multiple image storage
-- Author: DigiStall Development Team
-- Date: December 7, 2025
-- =============================================

-- Create stall_images table
CREATE TABLE IF NOT EXISTS `stall_images` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `stall_id` INT NOT NULL,
  `image_url` VARCHAR(255) NOT NULL,
  `display_order` TINYINT DEFAULT 1 COMMENT 'Order of image display (1-10)',
  `is_primary` TINYINT(1) DEFAULT 0 COMMENT 'Primary/featured image flag',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`stall_id`) REFERENCES `stall`(`stall_id`) ON DELETE CASCADE,
  INDEX `idx_stall_id` (`stall_id`),
  INDEX `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Stores multiple images for each stall (max 10 per stall)';

-- Add constraint to limit 10 images per stall
DELIMITER $$

CREATE TRIGGER `before_stall_image_insert`
BEFORE INSERT ON `stall_images`
FOR EACH ROW
BEGIN
  DECLARE image_count INT;
  
  -- Count existing images for this stall
  SELECT COUNT(*) INTO image_count 
  FROM stall_images 
  WHERE stall_id = NEW.stall_id;
  
  -- Prevent insertion if already at limit
  IF image_count >= 10 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Cannot add more than 10 images per stall';
  END IF;
  
  -- Auto-set display_order if not provided
  IF NEW.display_order IS NULL THEN
    SET NEW.display_order = image_count + 1;
  END IF;
  
  -- Ensure only one primary image per stall
  IF NEW.is_primary = 1 THEN
    UPDATE stall_images 
    SET is_primary = 0 
    WHERE stall_id = NEW.stall_id;
  END IF;
END$$

CREATE TRIGGER `before_stall_image_update`
BEFORE UPDATE ON `stall_images`
FOR EACH ROW
BEGIN
  -- Ensure only one primary image per stall
  IF NEW.is_primary = 1 AND OLD.is_primary = 0 THEN
    UPDATE stall_images 
    SET is_primary = 0 
    WHERE stall_id = NEW.stall_id AND id != NEW.id;
  END IF;
END$$

DELIMITER ;

-- =============================================
-- STORED PROCEDURES FOR STALL IMAGES
-- =============================================

-- Procedure: Get all images for a stall
DROP PROCEDURE IF EXISTS `sp_getStallImages`;
DELIMITER $$

CREATE PROCEDURE `sp_getStallImages`(
  IN `p_stall_id` INT
)
BEGIN
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

-- Procedure: Add new stall image
DROP PROCEDURE IF EXISTS `sp_addStallImage`;
DELIMITER $$

CREATE PROCEDURE `sp_addStallImage`(
  IN `p_stall_id` INT,
  IN `p_image_url` VARCHAR(255),
  IN `p_is_primary` TINYINT(1)
)
BEGIN
  DECLARE v_image_count INT;
  
  -- Check if stall exists
  IF NOT EXISTS (SELECT 1 FROM stall WHERE stall_id = p_stall_id) THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Stall not found';
  END IF;
  
  -- Check image count limit
  SELECT COUNT(*) INTO v_image_count
  FROM stall_images
  WHERE stall_id = p_stall_id;
  
  IF v_image_count >= 10 THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Maximum of 10 images per stall reached';
  END IF;
  
  -- Insert image
  INSERT INTO stall_images (stall_id, image_url, is_primary, display_order)
  VALUES (p_stall_id, p_image_url, COALESCE(p_is_primary, 0), v_image_count + 1);
  
  -- Return inserted image
  SELECT * FROM stall_images WHERE id = LAST_INSERT_ID();
END$$

DELIMITER ;

-- Procedure: Delete stall image
DROP PROCEDURE IF EXISTS `sp_deleteStallImage`;
DELIMITER $$

CREATE PROCEDURE `sp_deleteStallImage`(
  IN `p_image_id` INT
)
BEGIN
  DECLARE v_stall_id INT;
  DECLARE v_image_url VARCHAR(255);
  
  -- Get stall_id and image_url before deletion
  SELECT stall_id, image_url INTO v_stall_id, v_image_url
  FROM stall_images
  WHERE id = p_image_id;
  
  IF v_stall_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Image not found';
  END IF;
  
  -- Delete the image
  DELETE FROM stall_images WHERE id = p_image_id;
  
  -- Return deleted image info
  SELECT v_stall_id AS stall_id, v_image_url AS image_url, p_image_id AS id;
END$$

DELIMITER ;

-- Procedure: Set primary image
DROP PROCEDURE IF EXISTS `sp_setStallPrimaryImage`;
DELIMITER $$

CREATE PROCEDURE `sp_setStallPrimaryImage`(
  IN `p_image_id` INT
)
BEGIN
  DECLARE v_stall_id INT;
  
  -- Get stall_id
  SELECT stall_id INTO v_stall_id
  FROM stall_images
  WHERE id = p_image_id;
  
  IF v_stall_id IS NULL THEN
    SIGNAL SQLSTATE '45000'
    SET MESSAGE_TEXT = 'Image not found';
  END IF;
  
  -- Reset all images for this stall
  UPDATE stall_images 
  SET is_primary = 0 
  WHERE stall_id = v_stall_id;
  
  -- Set the new primary image
  UPDATE stall_images 
  SET is_primary = 1 
  WHERE id = p_image_id;
  
  SELECT 'Primary image updated successfully' AS message;
END$$

DELIMITER ;

-- =============================================
-- DATA MIGRATION: Migrate existing single images
-- =============================================
-- Migrate existing stall_image data from stall table to stall_images table
-- Only migrates stalls that have a non-empty stall_image value
-- Sets migrated images as primary with display_order = 1

INSERT INTO stall_images (stall_id, image_url, is_primary, display_order)
SELECT 
  stall_id, 
  stall_image, 
  1,  -- Set as primary image
  1   -- Set as first image
FROM stall 
WHERE stall_image IS NOT NULL 
  AND stall_image != ''
  AND stall_image != 'null'
  AND NOT EXISTS (
    SELECT 1 FROM stall_images WHERE stall_images.stall_id = stall.stall_id
  );

-- Display migration summary
SELECT 
  COUNT(*) AS 'Images Migrated',
  CONCAT('Successfully migrated ', COUNT(*), ' existing stall images to stall_images table') AS 'Migration Status'
FROM stall_images
WHERE is_primary = 1;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
-- Note: The old stall.stall_image column is kept for backward compatibility
-- You can optionally drop it later with: ALTER TABLE stall DROP COLUMN stall_image;
-- =============================================
