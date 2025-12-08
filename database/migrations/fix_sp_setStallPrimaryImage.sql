-- Migration: Update sp_setStallPrimaryImage to accept only image_id
-- This makes it compatible with the existing API call

DELIMITER //

DROP PROCEDURE IF EXISTS sp_setStallPrimaryImage//

CREATE PROCEDURE sp_setStallPrimaryImage(
    IN p_image_id INT
)
BEGIN
    DECLARE v_stall_id INT;
    
    -- Get stall_id from the image record
    SELECT stall_id INTO v_stall_id 
    FROM stall_images 
    WHERE id = p_image_id;
    
    IF v_stall_id IS NOT NULL THEN
        -- First, set all images for this stall to non-primary
        UPDATE stall_images 
        SET is_primary = 0 
        WHERE stall_id = v_stall_id;
        
        -- Then set the specified image as primary
        UPDATE stall_images 
        SET is_primary = 1 
        WHERE id = p_image_id;
    END IF;
END//

DELIMITER ;

SELECT 'sp_setStallPrimaryImage updated successfully' AS status;
