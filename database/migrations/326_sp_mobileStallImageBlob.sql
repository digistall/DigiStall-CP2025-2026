-- =============================================
-- MOBILE STALL IMAGE BLOB STORED PROCEDURES
-- Migration: 326_sp_mobileStallImageBlob.sql
-- Purpose: Convert raw SQL queries in Backend-Mobile/controllers/stalls/stallImageBlobController.js to stored procedures
-- =============================================

DELIMITER //

-- =============================================
-- GET STALL IMAGE BY POSITION (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallImageByPositionMobile//
CREATE PROCEDURE sp_getStallImageByPositionMobile(
    IN p_stall_id INT,
    IN p_display_order INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id AND display_order = p_display_order;
END//

-- =============================================
-- GET STALL IMAGE INFO BY ID (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallImageInfoByIdMobile//
CREATE PROCEDURE sp_getStallImageInfoByIdMobile(
    IN p_image_id INT
)
BEGIN
    SELECT id, stall_id, mime_type, file_name, LENGTH(image_data) as data_size 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- =============================================
-- GET STALL IMAGE BY ID (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallImageByIdMobile//
CREATE PROCEDURE sp_getStallImageByIdMobile(
    IN p_image_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- =============================================
-- GET ALL STALL IMAGES WITHOUT DATA (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllStallImagesMobile//
CREATE PROCEDURE sp_getAllStallImagesMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT id, stall_id, image_url, mime_type, file_name, display_order, is_primary, created_at, updated_at 
    FROM stall_images 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order;
END//

-- =============================================
-- GET ALL STALL IMAGES WITH DATA (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllStallImagesWithDataMobile//
CREATE PROCEDURE sp_getAllStallImagesWithDataMobile(
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

-- =============================================
-- GET STALL IMAGE FOR DELETE CHECK (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallImageForDeleteMobile//
CREATE PROCEDURE sp_getStallImageForDeleteMobile(
    IN p_image_id INT
)
BEGIN
    SELECT id, stall_id, is_primary 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- =============================================
-- DELETE STALL IMAGE (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_deleteStallImageMobile//
CREATE PROCEDURE sp_deleteStallImageMobile(
    IN p_image_id INT
)
BEGIN
    DELETE FROM stall_images WHERE id = p_image_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =============================================
-- SET FIRST IMAGE AS PRIMARY AFTER DELETE (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_setFirstImageAsPrimaryMobile//
CREATE PROCEDURE sp_setFirstImageAsPrimaryMobile(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall_images 
    SET is_primary = 1 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order 
    LIMIT 1;
END//

-- =============================================
-- GET REMAINING STALL IMAGES (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getRemainingStallImagesMobile//
CREATE PROCEDURE sp_getRemainingStallImagesMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT id FROM stall_images WHERE stall_id = p_stall_id ORDER BY display_order;
END//

-- =============================================
-- UPDATE STALL IMAGE ORDER (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStallImageOrderMobile//
CREATE PROCEDURE sp_updateStallImageOrderMobile(
    IN p_image_id INT,
    IN p_display_order INT
)
BEGIN
    UPDATE stall_images SET display_order = p_display_order WHERE id = p_image_id;
END//

-- =============================================
-- GET STALL ID FROM IMAGE (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallIdFromImageMobile//
CREATE PROCEDURE sp_getStallIdFromImageMobile(
    IN p_image_id INT
)
BEGIN
    SELECT stall_id FROM stall_images WHERE id = p_image_id;
END//

-- =============================================
-- UNSET STALL PRIMARY IMAGES (for Mobile - already exists but re-define for clarity)
-- =============================================
DROP PROCEDURE IF EXISTS sp_unsetStallPrimaryImagesMobile//
CREATE PROCEDURE sp_unsetStallPrimaryImagesMobile(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall_images SET is_primary = 0 WHERE stall_id = p_stall_id;
END//

-- =============================================
-- SET STALL IMAGE PRIMARY (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_setStallImagePrimaryMobile//
CREATE PROCEDURE sp_setStallImagePrimaryMobile(
    IN p_image_id INT
)
BEGIN
    UPDATE stall_images SET is_primary = 1 WHERE id = p_image_id;
END//

-- =============================================
-- CHECK STALL IMAGE EXISTS (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkStallImageExistsMobile//
CREATE PROCEDURE sp_checkStallImageExistsMobile(
    IN p_image_id INT
)
BEGIN
    SELECT id FROM stall_images WHERE id = p_image_id;
END//

-- =============================================
-- UPDATE STALL IMAGE BLOB (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStallImageBlobMobile//
CREATE PROCEDURE sp_updateStallImageBlobMobile(
    IN p_image_id INT,
    IN p_image_data LONGBLOB,
    IN p_mime_type VARCHAR(100),
    IN p_file_name VARCHAR(255)
)
BEGIN
    UPDATE stall_images 
    SET image_data = p_image_data, 
        mime_type = p_mime_type, 
        file_name = p_file_name, 
        updated_at = NOW() 
    WHERE id = p_image_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =============================================
-- GET STALL PRIMARY IMAGE (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallPrimaryImageMobile//
CREATE PROCEDURE sp_getStallPrimaryImageMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id AND is_primary = 1;
END//

-- =============================================
-- GET STALL FIRST IMAGE (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStallFirstImageMobile//
CREATE PROCEDURE sp_getStallFirstImageMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order 
    LIMIT 1;
END//

-- =============================================
-- CHECK STALL EXISTS (for Mobile)
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkStallExistsMobile//
CREATE PROCEDURE sp_checkStallExistsMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT stall_id FROM stall WHERE stall_id = p_stall_id;
END//

DELIMITER ;
