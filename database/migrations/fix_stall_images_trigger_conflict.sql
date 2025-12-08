-- Fix the trigger conflict: Remove UPDATE from trigger and procedure
-- Handle primary image logic at application level instead

-- 1. Drop and recreate the trigger WITHOUT the UPDATE that causes conflicts
DROP TRIGGER IF EXISTS before_stall_image_insert;

DELIMITER $$

CREATE TRIGGER before_stall_image_insert
BEFORE INSERT ON stall_images
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
  
  -- NOTE: Removed UPDATE logic - will handle primary image at application level
END$$

DELIMITER ;

-- 2. Simplify sp_addStallImage - no UPDATE, just INSERT
DROP PROCEDURE IF EXISTS sp_addStallImage;

DELIMITER $$

CREATE PROCEDURE sp_addStallImage(
    IN p_stall_id INT,
    IN p_image_url VARCHAR(500),
    IN p_is_primary TINYINT(1)
)
BEGIN
    -- Simple INSERT - trigger will handle display_order
    -- No UPDATE to avoid conflict
    INSERT INTO stall_images (
        stall_id,
        image_url,
        is_primary,
        display_order
    ) VALUES (
        p_stall_id,
        p_image_url,
        p_is_primary,
        NULL  -- Let trigger auto-assign
    );
END$$

DELIMITER ;

SELECT '✅ Trigger and procedure fixed - no more UPDATE conflicts!' as status;
