-- Fix sp_addStallImage to remove upload_date column reference and subquery issue
-- The stall_images table only has created_at and updated_at, not upload_date

DROP PROCEDURE IF EXISTS sp_addStallImage;

DELIMITER $$

CREATE PROCEDURE sp_addStallImage(
    IN p_stall_id INT,
    IN p_image_url VARCHAR(500),
    IN p_is_primary TINYINT(1)
)
BEGIN
    DECLARE next_order INT;
    
    -- If this image should be primary, unset other primary images
    IF p_is_primary = 1 THEN
        UPDATE stall_images 
        SET is_primary = 0 
        WHERE stall_id = p_stall_id;
    END IF;

    -- Get next display order (separate query to avoid "table specified twice" error)
    SELECT COALESCE(MAX(display_order), 0) + 1 INTO next_order
    FROM stall_images 
    WHERE stall_id = p_stall_id;

    -- Insert the new image (created_at is auto-populated by DEFAULT current_timestamp())
    INSERT INTO stall_images (
        stall_id,
        image_url,
        is_primary,
        display_order
    ) VALUES (
        p_stall_id,
        p_image_url,
        p_is_primary,
        next_order
    );
END$$

DELIMITER ;

SELECT 'sp_addStallImage procedure fixed successfully!' as status;
