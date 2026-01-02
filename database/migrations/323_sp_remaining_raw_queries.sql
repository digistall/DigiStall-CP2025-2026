-- =============================================
-- Migration 323: Remaining Raw SQL to Stored Procedures
-- =============================================
-- Purpose: Convert all remaining raw SQL queries to stored procedures
-- Covers: Mobile StallImageBlob, StallholderDocumentBlob, 
--         Web multerApplicantDocuments, getFloors, getSections,
--         Landing page components
-- =============================================

DELIMITER //

-- =============================================
-- MOBILE STALL IMAGE BLOB PROCEDURES
-- =============================================

-- Get stall image by stall_id and display_order
DROP PROCEDURE IF EXISTS sp_getStallImageByOrder//
CREATE PROCEDURE sp_getStallImageByOrder(
    IN p_stall_id INT,
    IN p_display_order INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id AND display_order = p_display_order;
END//

-- Check stall image exists by ID (for debugging)
DROP PROCEDURE IF EXISTS sp_checkStallImageById//
CREATE PROCEDURE sp_checkStallImageById(
    IN p_image_id INT
)
BEGIN
    SELECT id, stall_id, mime_type, file_name, LENGTH(image_data) as data_size 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- Get stall image data by ID
DROP PROCEDURE IF EXISTS sp_getStallImageDataById//
CREATE PROCEDURE sp_getStallImageDataById(
    IN p_image_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- Get all stall images with optional base64 data
DROP PROCEDURE IF EXISTS sp_getStallImagesWithData//
CREATE PROCEDURE sp_getStallImagesWithData(
    IN p_stall_id INT,
    IN p_include_data BOOLEAN
)
BEGIN
    IF p_include_data THEN
        SELECT id, stall_id, image_url, 
               TO_BASE64(image_data) as image_base64, 
               mime_type, file_name, display_order, is_primary, created_at, updated_at 
        FROM stall_images 
        WHERE stall_id = p_stall_id 
        ORDER BY display_order;
    ELSE
        SELECT id, stall_id, image_url, mime_type, file_name, display_order, is_primary, created_at, updated_at 
        FROM stall_images 
        WHERE stall_id = p_stall_id 
        ORDER BY display_order;
    END IF;
END//

-- Get stall image info for delete operation
DROP PROCEDURE IF EXISTS sp_getStallImageForDelete//
CREATE PROCEDURE sp_getStallImageForDelete(
    IN p_image_id INT
)
BEGIN
    SELECT id, stall_id, is_primary 
    FROM stall_images 
    WHERE id = p_image_id;
END//

-- Delete stall image by ID
DROP PROCEDURE IF EXISTS sp_deleteStallImage//
CREATE PROCEDURE sp_deleteStallImage(
    IN p_image_id INT
)
BEGIN
    DELETE FROM stall_images WHERE id = p_image_id;
END//

-- Set next primary image after deletion
DROP PROCEDURE IF EXISTS sp_setNextPrimaryImage//
CREATE PROCEDURE sp_setNextPrimaryImage(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall_images 
    SET is_primary = 1 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order 
    LIMIT 1;
END//

-- Get remaining images for reorder
DROP PROCEDURE IF EXISTS sp_getRemainingImagesForReorder//
CREATE PROCEDURE sp_getRemainingImagesForReorder(
    IN p_stall_id INT
)
BEGIN
    SELECT id FROM stall_images 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order;
END//

-- Update image display order
DROP PROCEDURE IF EXISTS sp_updateImageDisplayOrder//
CREATE PROCEDURE sp_updateImageDisplayOrder(
    IN p_image_id INT,
    IN p_display_order INT
)
BEGIN
    UPDATE stall_images 
    SET display_order = p_display_order 
    WHERE id = p_image_id;
END//

-- Get stall_id from image
DROP PROCEDURE IF EXISTS sp_getStallIdFromImage//
CREATE PROCEDURE sp_getStallIdFromImage(
    IN p_image_id INT
)
BEGIN
    SELECT stall_id FROM stall_images WHERE id = p_image_id;
END//

-- Unset all primary images for stall
DROP PROCEDURE IF EXISTS sp_unsetAllPrimaryImages//
CREATE PROCEDURE sp_unsetAllPrimaryImages(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall_images SET is_primary = 0 WHERE stall_id = p_stall_id;
END//

-- Set image as primary
DROP PROCEDURE IF EXISTS sp_setImageAsPrimary//
CREATE PROCEDURE sp_setImageAsPrimary(
    IN p_image_id INT
)
BEGIN
    UPDATE stall_images SET is_primary = 1 WHERE id = p_image_id;
END//

-- Check image exists by ID
DROP PROCEDURE IF EXISTS sp_checkImageExistsById//
CREATE PROCEDURE sp_checkImageExistsById(
    IN p_image_id INT
)
BEGIN
    SELECT id FROM stall_images WHERE id = p_image_id;
END//

-- Update stall image blob data
DROP PROCEDURE IF EXISTS sp_updateStallImageBlobData//
CREATE PROCEDURE sp_updateStallImageBlobData(
    IN p_image_id INT,
    IN p_image_data LONGBLOB,
    IN p_mime_type VARCHAR(50),
    IN p_file_name VARCHAR(255)
)
BEGIN
    UPDATE stall_images 
    SET image_data = p_image_data, 
        mime_type = p_mime_type, 
        file_name = p_file_name, 
        updated_at = NOW() 
    WHERE id = p_image_id;
END//

-- Get primary image for stall
DROP PROCEDURE IF EXISTS sp_getStallPrimaryImage//
CREATE PROCEDURE sp_getStallPrimaryImage(
    IN p_stall_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id AND is_primary = 1;
END//

-- Get first image for stall (fallback)
DROP PROCEDURE IF EXISTS sp_getStallFirstImage//
CREATE PROCEDURE sp_getStallFirstImage(
    IN p_stall_id INT
)
BEGIN
    SELECT image_data, mime_type, file_name 
    FROM stall_images 
    WHERE stall_id = p_stall_id 
    ORDER BY display_order 
    LIMIT 1;
END//

-- Check stall exists for legacy delete
DROP PROCEDURE IF EXISTS sp_checkStallExistsById//
CREATE PROCEDURE sp_checkStallExistsById(
    IN p_stall_id INT
)
BEGIN
    SELECT stall_id FROM stall WHERE stall_id = p_stall_id;
END//

-- =============================================
-- STALLHOLDER DOCUMENT BLOB PROCEDURES
-- =============================================

-- Check stallholder exists
DROP PROCEDURE IF EXISTS sp_checkStallholderExists//
CREATE PROCEDURE sp_checkStallholderExists(
    IN p_stallholder_id INT
)
BEGIN
    SELECT stallholder_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
END//

-- Check existing stallholder document
DROP PROCEDURE IF EXISTS sp_checkExistingStallholderDocument//
CREATE PROCEDURE sp_checkExistingStallholderDocument(
    IN p_stallholder_id INT,
    IN p_document_type_id INT
)
BEGIN
    SELECT document_id FROM stallholder_documents 
    WHERE stallholder_id = p_stallholder_id AND document_type_id = p_document_type_id;
END//

-- Update stallholder document blob
DROP PROCEDURE IF EXISTS sp_updateStallholderDocumentBlob//
CREATE PROCEDURE sp_updateStallholderDocumentBlob(
    IN p_document_id INT,
    IN p_file_path VARCHAR(500),
    IN p_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_document_data LONGBLOB,
    IN p_expiry_date DATE,
    IN p_notes TEXT
)
BEGIN
    UPDATE stallholder_documents 
    SET file_path = p_file_path,
        original_filename = p_filename,
        file_size = p_file_size,
        document_data = p_document_data,
        storage_type = 'blob',
        upload_date = NOW(),
        verification_status = 'pending',
        verified_by = NULL,
        verified_at = NULL,
        rejection_reason = NULL,
        expiry_date = p_expiry_date,
        notes = p_notes
    WHERE document_id = p_document_id;
END//

-- Insert stallholder document blob
DROP PROCEDURE IF EXISTS sp_insertStallholderDocumentBlob//
CREATE PROCEDURE sp_insertStallholderDocumentBlob(
    IN p_stallholder_id INT,
    IN p_document_type_id INT,
    IN p_file_path VARCHAR(500),
    IN p_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_document_data LONGBLOB,
    IN p_expiry_date DATE,
    IN p_notes TEXT
)
BEGIN
    INSERT INTO stallholder_documents (
        stallholder_id, document_type_id,
        file_path, original_filename, file_size,
        document_data, storage_type, expiry_date, notes, verification_status
    ) VALUES (
        p_stallholder_id, p_document_type_id,
        p_file_path, p_filename, p_file_size,
        p_document_data, 'blob', p_expiry_date, p_notes, 'pending'
    );
    SELECT LAST_INSERT_ID() as document_id;
END//

-- Check existing document submission
DROP PROCEDURE IF EXISTS sp_checkExistingDocumentSubmission//
CREATE PROCEDURE sp_checkExistingDocumentSubmission(
    IN p_stallholder_id INT,
    IN p_requirement_id INT,
    IN p_owner_id INT
)
BEGIN
    SELECT submission_id FROM stallholder_document_submissions 
    WHERE stallholder_id = p_stallholder_id 
      AND requirement_id = p_requirement_id 
      AND owner_id = p_owner_id;
END//

-- Update document submission blob
DROP PROCEDURE IF EXISTS sp_updateDocumentSubmissionBlob//
CREATE PROCEDURE sp_updateDocumentSubmissionBlob(
    IN p_submission_id INT,
    IN p_file_url VARCHAR(500),
    IN p_file_name VARCHAR(255),
    IN p_file_type VARCHAR(100),
    IN p_file_size INT,
    IN p_document_data LONGBLOB
)
BEGIN
    UPDATE stallholder_document_submissions 
    SET file_url = p_file_url,
        file_name = p_file_name,
        file_type = p_file_type,
        file_size = p_file_size,
        document_data = p_document_data,
        storage_type = 'blob',
        status = 'pending',
        rejection_reason = NULL,
        uploaded_at = NOW(),
        updated_at = NOW(),
        reviewed_by = NULL,
        reviewed_at = NULL
    WHERE submission_id = p_submission_id;
END//

-- Insert document submission blob
DROP PROCEDURE IF EXISTS sp_insertDocumentSubmissionBlob//
CREATE PROCEDURE sp_insertDocumentSubmissionBlob(
    IN p_stallholder_id INT,
    IN p_owner_id INT,
    IN p_requirement_id INT,
    IN p_application_id INT,
    IN p_file_url VARCHAR(500),
    IN p_file_name VARCHAR(255),
    IN p_file_type VARCHAR(100),
    IN p_file_size INT,
    IN p_document_data LONGBLOB
)
BEGIN
    INSERT INTO stallholder_document_submissions (
        stallholder_id, owner_id, requirement_id, application_id,
        file_url, file_name, file_type, file_size,
        document_data, storage_type, status
    ) VALUES (
        p_stallholder_id, p_owner_id, p_requirement_id, p_application_id,
        p_file_url, p_file_name, p_file_type, p_file_size,
        p_document_data, 'blob', 'pending'
    );
    SELECT LAST_INSERT_ID() as submission_id;
END//

-- Get stallholder document blob
DROP PROCEDURE IF EXISTS sp_getStallholderDocumentBlob//
CREATE PROCEDURE sp_getStallholderDocumentBlob(
    IN p_stallholder_id INT,
    IN p_document_type_id INT
)
BEGIN
    SELECT document_data, storage_type, original_filename,
           (SELECT document_name FROM document_types WHERE document_type_id = sd.document_type_id) as document_name
    FROM stallholder_documents sd
    WHERE stallholder_id = p_stallholder_id 
      AND document_type_id = p_document_type_id 
      AND storage_type = 'blob' 
      AND document_data IS NOT NULL
    ORDER BY upload_date DESC 
    LIMIT 1;
END//

-- Get stallholder document blob by ID
DROP PROCEDURE IF EXISTS sp_getStallholderDocumentBlobById//
CREATE PROCEDURE sp_getStallholderDocumentBlobById(
    IN p_document_id INT
)
BEGIN
    SELECT document_data, original_filename
    FROM stallholder_documents
    WHERE document_id = p_document_id 
      AND storage_type = 'blob' 
      AND document_data IS NOT NULL;
END//

-- Get stallholder document submission blob
DROP PROCEDURE IF EXISTS sp_getStallholderDocumentSubmissionBlob//
CREATE PROCEDURE sp_getStallholderDocumentSubmissionBlob(
    IN p_submission_id INT
)
BEGIN
    SELECT document_data, file_name, file_type
    FROM stallholder_document_submissions
    WHERE submission_id = p_submission_id 
      AND storage_type = 'blob' 
      AND document_data IS NOT NULL;
END//

-- Get all stallholder documents
DROP PROCEDURE IF EXISTS sp_getAllStallholderDocuments//
CREATE PROCEDURE sp_getAllStallholderDocuments(
    IN p_stallholder_id INT,
    IN p_include_data BOOLEAN
)
BEGIN
    IF p_include_data THEN
        SELECT 
            sd.document_id, sd.stallholder_id, sd.document_type_id,
            dt.document_name, dt.description as document_description,
            sd.file_path, sd.original_filename, sd.file_size,
            sd.upload_date, sd.verification_status, sd.verified_at, sd.verified_by,
            sd.rejection_reason, sd.expiry_date, sd.notes, sd.storage_type,
            TO_BASE64(sd.document_data) as document_data_base64
        FROM stallholder_documents sd
        LEFT JOIN document_types dt ON sd.document_type_id = dt.document_type_id
        WHERE sd.stallholder_id = p_stallholder_id
        ORDER BY dt.document_name ASC, sd.upload_date DESC;
    ELSE
        SELECT 
            sd.document_id, sd.stallholder_id, sd.document_type_id,
            dt.document_name, dt.description as document_description,
            sd.file_path, sd.original_filename, sd.file_size,
            sd.upload_date, sd.verification_status, sd.verified_at, sd.verified_by,
            sd.rejection_reason, sd.expiry_date, sd.notes, sd.storage_type
        FROM stallholder_documents sd
        LEFT JOIN document_types dt ON sd.document_type_id = dt.document_type_id
        WHERE sd.stallholder_id = p_stallholder_id
        ORDER BY dt.document_name ASC, sd.upload_date DESC;
    END IF;
END//

-- Check document exists for delete
DROP PROCEDURE IF EXISTS sp_checkDocumentExistsForDelete//
CREATE PROCEDURE sp_checkDocumentExistsForDelete(
    IN p_document_id INT
)
BEGIN
    SELECT document_id FROM stallholder_documents WHERE document_id = p_document_id;
END//

-- Delete stallholder document
DROP PROCEDURE IF EXISTS sp_deleteStallholderDocument//
CREATE PROCEDURE sp_deleteStallholderDocument(
    IN p_document_id INT
)
BEGIN
    DELETE FROM stallholder_documents WHERE document_id = p_document_id;
END//

-- Update stallholder document verification
DROP PROCEDURE IF EXISTS sp_updateStallholderDocumentVerification//
CREATE PROCEDURE sp_updateStallholderDocumentVerification(
    IN p_document_id INT,
    IN p_verification_status VARCHAR(50),
    IN p_rejection_reason TEXT,
    IN p_verified_by INT
)
BEGIN
    UPDATE stallholder_documents 
    SET verification_status = p_verification_status,
        rejection_reason = p_rejection_reason,
        verified_by = p_verified_by,
        verified_at = NOW()
    WHERE document_id = p_document_id;
END//

-- =============================================
-- MULTER APPLICANT DOCUMENTS PROCEDURES
-- =============================================

-- Check existing applicant document for multer
DROP PROCEDURE IF EXISTS sp_checkExistingApplicantDocumentMulter//
CREATE PROCEDURE sp_checkExistingApplicantDocumentMulter(
    IN p_applicant_id INT,
    IN p_business_owner_id INT,
    IN p_document_type_id INT
)
BEGIN
    SELECT document_id FROM applicant_documents 
    WHERE applicant_id = p_applicant_id 
      AND business_owner_id = p_business_owner_id 
      AND document_type_id = p_document_type_id;
END//

-- Update applicant document for multer
DROP PROCEDURE IF EXISTS sp_updateApplicantDocumentMulter//
CREATE PROCEDURE sp_updateApplicantDocumentMulter(
    IN p_document_id INT,
    IN p_file_path VARCHAR(500),
    IN p_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_mime_type VARCHAR(100),
    IN p_document_data LONGBLOB
)
BEGIN
    UPDATE applicant_documents 
    SET file_path = p_file_path,
        original_filename = p_filename,
        file_size = p_file_size,
        mime_type = p_mime_type,
        document_data = p_document_data,
        storage_type = 'blob',
        upload_date = NOW(),
        verification_status = 'pending',
        updated_at = NOW()
    WHERE document_id = p_document_id;
END//

-- Insert applicant document for multer
DROP PROCEDURE IF EXISTS sp_insertApplicantDocumentMulter//
CREATE PROCEDURE sp_insertApplicantDocumentMulter(
    IN p_applicant_id INT,
    IN p_business_owner_id INT,
    IN p_branch_id INT,
    IN p_document_type_id INT,
    IN p_file_path VARCHAR(500),
    IN p_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_mime_type VARCHAR(100),
    IN p_document_data LONGBLOB
)
BEGIN
    INSERT INTO applicant_documents (
        applicant_id, business_owner_id, branch_id, document_type_id,
        file_path, original_filename, file_size, mime_type,
        document_data, storage_type, verification_status
    ) VALUES (
        p_applicant_id, p_business_owner_id, p_branch_id, p_document_type_id,
        p_file_path, p_filename, p_file_size, p_mime_type,
        p_document_data, 'blob', 'pending'
    );
    SELECT LAST_INSERT_ID() as document_id;
END//

-- =============================================
-- GET FLOORS PROCEDURES
-- =============================================

-- Get all floors (system admin)
DROP PROCEDURE IF EXISTS sp_getAllFloors//
CREATE PROCEDURE sp_getAllFloors()
BEGIN
    SELECT f.* FROM floor f;
END//

-- Get floors by single branch
DROP PROCEDURE IF EXISTS sp_getFloorsByBranch//
CREATE PROCEDURE sp_getFloorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT f.* FROM floor f WHERE f.branch_id = p_branch_id;
END//

-- Get floors by multiple branches (dynamic)
DROP PROCEDURE IF EXISTS sp_getFloorsByBranches//
CREATE PROCEDURE sp_getFloorsByBranches(
    IN p_branch_ids TEXT
)
BEGIN
    SET @sql = CONCAT('SELECT f.* FROM floor f WHERE f.branch_id IN (', p_branch_ids, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =============================================
-- GET SECTIONS PROCEDURES
-- =============================================

-- Get all sections (system admin)
DROP PROCEDURE IF EXISTS sp_getAllSections//
CREATE PROCEDURE sp_getAllSections()
BEGIN
    SELECT s.* FROM section s;
END//

-- Get sections by single branch
DROP PROCEDURE IF EXISTS sp_getSectionsByBranch//
CREATE PROCEDURE sp_getSectionsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT s.* FROM section s
    INNER JOIN floor f ON s.floor_id = f.floor_id
    WHERE f.branch_id = p_branch_id;
END//

-- Get sections by multiple branches (dynamic)
DROP PROCEDURE IF EXISTS sp_getSectionsByBranches//
CREATE PROCEDURE sp_getSectionsByBranches(
    IN p_branch_ids TEXT
)
BEGIN
    SET @sql = CONCAT('SELECT s.* FROM section s INNER JOIN floor f ON s.floor_id = f.floor_id WHERE f.branch_id IN (', p_branch_ids, ')');
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =============================================
-- WEB STALL IMAGE BLOB PROCEDURES (remaining)
-- =============================================

-- Check stall exists for legacy delete (web)
DROP PROCEDURE IF EXISTS sp_checkStallExistsWeb//
CREATE PROCEDURE sp_checkStallExistsWeb(
    IN p_stall_id INT
)
BEGIN
    SELECT stall_id FROM stall WHERE stall_id = p_stall_id;
END//

DELIMITER ;

-- =============================================
-- END OF MIGRATION 323
-- =============================================
