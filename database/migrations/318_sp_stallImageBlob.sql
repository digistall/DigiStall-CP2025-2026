-- Migration 318: Stall Image BLOB Stored Procedures
-- This creates stored procedures for stall image blob operations

DELIMITER //

-- =====================================================
-- SP: sp_checkStallExists
-- Purpose: Verify a stall exists by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkStallExists//
CREATE PROCEDURE sp_checkStallExists(
    IN p_stall_id INT
)
BEGIN
    SELECT stall_id FROM stall WHERE stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_getStallImageCount
-- Purpose: Get count of images for a stall
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallImageCount//
CREATE PROCEDURE sp_getStallImageCount(
    IN p_stall_id INT
)
BEGIN
    SELECT COUNT(*) as count FROM stall_images WHERE stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_getNextStallImageOrder
-- Purpose: Get the next display order for stall images
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getNextStallImageOrder//
CREATE PROCEDURE sp_getNextStallImageOrder(
    IN p_stall_id INT
)
BEGIN
    SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM stall_images WHERE stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_unsetStallPrimaryImages
-- Purpose: Unset all primary images for a stall
-- =====================================================
DROP PROCEDURE IF EXISTS sp_unsetStallPrimaryImages//
CREATE PROCEDURE sp_unsetStallPrimaryImages(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall_images SET is_primary = 0 WHERE stall_id = p_stall_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_insertStallImageBlob
-- Purpose: Insert a new stall image with BLOB data
-- =====================================================
DROP PROCEDURE IF EXISTS sp_insertStallImageBlob//
CREATE PROCEDURE sp_insertStallImageBlob(
    IN p_stall_id INT,
    IN p_image_url VARCHAR(500),
    IN p_image_data LONGBLOB,
    IN p_mime_type VARCHAR(50),
    IN p_file_name VARCHAR(255),
    IN p_display_order INT,
    IN p_is_primary BOOLEAN
)
BEGIN
    INSERT INTO stall_images (stall_id, image_url, image_data, mime_type, file_name, display_order, is_primary, created_at) 
    VALUES (p_stall_id, p_image_url, p_image_data, p_mime_type, p_file_name, p_display_order, p_is_primary, NOW());
    
    SELECT LAST_INSERT_ID() as insert_id;
END//

-- =====================================================
-- SP: sp_getStallImageByPosition
-- Purpose: Get stall image by stall_id and display_order
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallImageByPosition//
CREATE PROCEDURE sp_getStallImageByPosition(
    IN p_stall_id INT,
    IN p_display_order INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id AND display_order = p_display_order;
END//

-- =====================================================
-- SP: sp_getStallImageById
-- Purpose: Get stall image by image ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallImageById//
CREATE PROCEDURE sp_getStallImageById(
    IN p_image_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- =====================================================
-- SP: sp_getStallImageInfoById
-- Purpose: Get stall image metadata by ID (for validation)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallImageInfoById//
CREATE PROCEDURE sp_getStallImageInfoById(
    IN p_image_id INT
)
BEGIN
    SELECT id, stall_id, mime_type, file_name, LENGTH(image_data) as data_size 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- =====================================================
-- SP: sp_getAllStallImages
-- Purpose: Get all images for a stall (metadata only)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllStallImages//
CREATE PROCEDURE sp_getAllStallImages(
    IN p_stall_id INT
)
BEGIN
    SELECT id, stall_id, image_url, mime_type, file_name, display_order, is_primary, created_at, updated_at 
    FROM stall_images 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order;
END//

-- =====================================================
-- SP: sp_getAllStallImagesWithData
-- Purpose: Get all images for a stall (with base64 data)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllStallImagesWithData//
CREATE PROCEDURE sp_getAllStallImagesWithData(
    IN p_stall_id INT
)
BEGIN
    SELECT id, stall_id, image_url, 
           TO_BASE64(image_data) as image_base64, 
           mime_type, file_name, display_order, is_primary, created_at, updated_at 
    FROM stall_images 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order;
END//

-- =====================================================
-- SP: sp_getStallImageForDelete
-- Purpose: Get image info before deletion
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallImageForDelete//
CREATE PROCEDURE sp_getStallImageForDelete(
    IN p_image_id INT
)
BEGIN
    SELECT id, stall_id, is_primary 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- =====================================================
-- SP: sp_deleteStallImage
-- Purpose: Delete a stall image
-- =====================================================
DROP PROCEDURE IF EXISTS sp_deleteStallImage//
CREATE PROCEDURE sp_deleteStallImage(
    IN p_image_id INT
)
BEGIN
    DELETE FROM stall_images WHERE id = p_image_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_setFirstImageAsPrimary
-- Purpose: Set the first image as primary for a stall
-- =====================================================
DROP PROCEDURE IF EXISTS sp_setFirstImageAsPrimary//
CREATE PROCEDURE sp_setFirstImageAsPrimary(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall_images 
    SET is_primary = 1 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order 
    LIMIT 1;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_getRemainingStallImages
-- Purpose: Get remaining images after deletion for reordering
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getRemainingStallImages//
CREATE PROCEDURE sp_getRemainingStallImages(
    IN p_stall_id INT
)
BEGIN
    SELECT id FROM stall_images 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order;
END//

-- =====================================================
-- SP: sp_updateStallImageOrder
-- Purpose: Update display order for an image
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateStallImageOrder//
CREATE PROCEDURE sp_updateStallImageOrder(
    IN p_image_id INT,
    IN p_new_order INT
)
BEGIN
    UPDATE stall_images SET display_order = p_new_order WHERE id = p_image_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_getStallIdFromImage
-- Purpose: Get stall_id from image record
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallIdFromImage//
CREATE PROCEDURE sp_getStallIdFromImage(
    IN p_image_id INT
)
BEGIN
    SELECT stall_id FROM stall_images WHERE id = p_image_id;
END//

-- =====================================================
-- SP: sp_setStallImagePrimary
-- Purpose: Set a specific image as primary
-- =====================================================
DROP PROCEDURE IF EXISTS sp_setStallImagePrimary//
CREATE PROCEDURE sp_setStallImagePrimary(
    IN p_image_id INT
)
BEGIN
    UPDATE stall_images SET is_primary = 1 WHERE id = p_image_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_checkStallImageExists
-- Purpose: Check if an image exists
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkStallImageExists//
CREATE PROCEDURE sp_checkStallImageExists(
    IN p_image_id INT
)
BEGIN
    SELECT id FROM stall_images WHERE id = p_image_id;
END//

-- =====================================================
-- SP: sp_updateStallImageBlob
-- Purpose: Update stall image blob data
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateStallImageBlob//
CREATE PROCEDURE sp_updateStallImageBlob(
    IN p_image_id INT,
    IN p_image_data LONGBLOB,
    IN p_mime_type VARCHAR(50),
    IN p_file_name VARCHAR(255)
)
BEGIN
    UPDATE stall_images 
    SET image_data = p_image_data, mime_type = p_mime_type, file_name = p_file_name, updated_at = NOW() 
    WHERE id = p_image_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_getStallPrimaryImage
-- Purpose: Get primary image for a stall
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallPrimaryImage//
CREATE PROCEDURE sp_getStallPrimaryImage(
    IN p_stall_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id AND is_primary = 1;
END//

-- =====================================================
-- SP: sp_getStallPrimaryImageInfo
-- Purpose: Get primary image info for a stall
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallPrimaryImageInfo//
CREATE PROCEDURE sp_getStallPrimaryImageInfo(
    IN p_stall_id INT
)
BEGIN
    SELECT id, stall_id, image_url, mime_type, file_name, display_order, is_primary, created_at
    FROM stall_images 
    WHERE stall_id = p_stall_id AND is_primary = 1;
END//

DELIMITER ;

-- Success message
SELECT 'Stall Image BLOB stored procedures created successfully' as status;
