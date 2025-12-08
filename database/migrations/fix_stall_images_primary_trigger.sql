-- Migration: Fix stall_images trigger conflict for is_primary
-- Issue: MySQL Error 1442 - Can't update table in stored function/trigger
-- because it's already used by statement which invoked the trigger
-- 
-- The before_stall_image_update trigger tries to UPDATE stall_images
-- when setting is_primary = 1, but MySQL doesn't allow a trigger to 
-- modify the same table that triggered it.
--
-- Solution: Remove the problematic trigger and handle is_primary logic 
-- in the stored procedure and application code.

DELIMITER //

-- 1. Drop the problematic trigger
DROP TRIGGER IF EXISTS before_stall_image_update//

-- 2. Create a helper procedure to set primary image safely
-- This can be called AFTER inserting images (not inside a trigger)
DROP PROCEDURE IF EXISTS sp_setStallPrimaryImage//
CREATE PROCEDURE sp_setStallPrimaryImage(
    IN p_stall_id INT,
    IN p_image_id INT
)
BEGIN
    -- First, set all images for this stall to non-primary
    UPDATE stall_images 
    SET is_primary = 0 
    WHERE stall_id = p_stall_id;
    
    -- Then set the specified image as primary
    UPDATE stall_images 
    SET is_primary = 1 
    WHERE id = p_image_id AND stall_id = p_stall_id;
END//

-- 3. Update sp_addStallImage to handle is_primary correctly
-- It should set is_primary directly during insert (not via trigger)
DROP PROCEDURE IF EXISTS sp_addStallImage//
CREATE PROCEDURE sp_addStallImage(
    IN p_stall_id INT,
    IN p_image_url VARCHAR(500),
    IN p_is_primary TINYINT
)
BEGIN
    DECLARE image_count INT DEFAULT 0;
    DECLARE new_display_order INT DEFAULT 1;
    DECLARE should_be_primary TINYINT DEFAULT 0;
    
    -- Get current image count for this stall
    SELECT COUNT(*) INTO image_count
    FROM stall_images
    WHERE stall_id = p_stall_id;
    
    -- Check if we've hit the limit
    IF image_count >= 10 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Cannot add more than 10 images per stall';
    END IF;
    
    -- Calculate display order
    SET new_display_order = image_count + 1;
    
    -- Determine if this should be primary
    -- If p_is_primary is 1, OR if this is the first image, make it primary
    IF p_is_primary = 1 OR image_count = 0 THEN
        SET should_be_primary = 1;
        
        -- If making this image primary, clear primary from other images
        IF should_be_primary = 1 AND image_count > 0 THEN
            UPDATE stall_images 
            SET is_primary = 0 
            WHERE stall_id = p_stall_id;
        END IF;
    ELSE
        SET should_be_primary = 0;
    END IF;
    
    -- Insert the new image with is_primary already set
    INSERT INTO stall_images (stall_id, image_url, is_primary, display_order, created_at)
    VALUES (p_stall_id, p_image_url, should_be_primary, new_display_order, NOW());
    
END//

DELIMITER ;

-- Verify the changes
SELECT 'Trigger dropped and procedures updated successfully' AS status;
SELECT ROUTINE_NAME, ROUTINE_TYPE 
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = 'naga_stall' 
AND ROUTINE_NAME IN ('sp_addStallImage', 'sp_setStallPrimaryImage');
