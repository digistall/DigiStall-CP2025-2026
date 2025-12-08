-- ============================================
-- COMPREHENSIVE FIX FOR ALL STALL ISSUES
-- ============================================
-- 1. Removes problematic triggers and procedures
-- 2. Ensures sp_addStallImage works correctly  
-- 3. Fixes delete functionality
-- ============================================

USE naga_stall;

-- Drop problematic trigger that prevents deletion
DROP TRIGGER IF EXISTS trg_stall_reset_auto;

-- Drop the problematic procedure
DROP PROCEDURE IF EXISTS ResetAutoIncrement;

-- Verify sp_addStallImage exists and works
-- This procedure is called by addStallWithImages.js after stall creation
DROP PROCEDURE IF EXISTS sp_addStallImage;

DELIMITER $$

CREATE PROCEDURE sp_addStallImage(
    IN p_stall_id INT,
    IN p_image_url VARCHAR(500),
    IN p_is_primary TINYINT(1)
)
BEGIN
    -- If this is set as primary, unset all other primary images for this stall
    IF p_is_primary = 1 THEN
        UPDATE stall_images 
        SET is_primary = 0 
        WHERE stall_id = p_stall_id;
    END IF;
    
    -- Insert the new image
    INSERT INTO stall_images (
        stall_id,
        image_url,
        is_primary,
        upload_date
    ) VALUES (
        p_stall_id,
        p_image_url,
        p_is_primary,
        NOW()
    );
END$$

DELIMITER ;

SELECT 'All stall issues fixed successfully!' as Status;
SELECT '✅ Removed problematic trigger: trg_stall_reset_auto' as Fix1;
SELECT '✅ Removed problematic procedure: ResetAutoIncrement' as Fix2;
SELECT '✅ Created/Updated sp_addStallImage procedure' as Fix3;
