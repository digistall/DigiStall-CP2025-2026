-- Migration 322: Mobile Document BLOB Controller Stored Procedures
-- This creates stored procedures for document BLOB operations in mobile app

DELIMITER //

-- =====================================================
-- SP: sp_verifyStallholderExists
-- Purpose: Check if stallholder exists
-- =====================================================
DROP PROCEDURE IF EXISTS sp_verifyStallholderExists//
CREATE PROCEDURE sp_verifyStallholderExists(
    IN p_stallholder_id INT
)
BEGIN
    SELECT stallholder_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
END//

-- =====================================================
-- SP: sp_checkExistingDocument
-- Purpose: Check if document already exists for stallholder/type
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkExistingDocument//
CREATE PROCEDURE sp_checkExistingDocument(
    IN p_stallholder_id INT,
    IN p_document_type_id INT
)
BEGIN
    SELECT document_id FROM stallholder_documents 
    WHERE stallholder_id = p_stallholder_id AND document_type_id = p_document_type_id;
END//

-- =====================================================
-- SP: sp_updateDocumentBlob
-- Purpose: Update existing document BLOB data
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateDocumentBlob//
CREATE PROCEDURE sp_updateDocumentBlob(
    IN p_document_id INT,
    IN p_file_path VARCHAR(500),
    IN p_original_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_document_data LONGBLOB,
    IN p_expiry_date DATE,
    IN p_notes TEXT
)
BEGIN
    UPDATE stallholder_documents 
    SET file_path = p_file_path,
        original_filename = p_original_filename,
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
    
    SELECT p_document_id as document_id;
END//

-- =====================================================
-- SP: sp_insertDocumentBlob
-- Purpose: Insert new document BLOB data
-- =====================================================
DROP PROCEDURE IF EXISTS sp_insertDocumentBlob//
CREATE PROCEDURE sp_insertDocumentBlob(
    IN p_stallholder_id INT,
    IN p_document_type_id INT,
    IN p_file_path VARCHAR(500),
    IN p_original_filename VARCHAR(255),
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
        p_file_path, p_original_filename, p_file_size,
        p_document_data, 'blob', p_expiry_date, p_notes, 'pending'
    );
    
    SELECT LAST_INSERT_ID() as document_id;
END//

-- =====================================================
-- SP: sp_checkExistingSubmission
-- Purpose: Check if document submission already exists
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkExistingSubmission//
CREATE PROCEDURE sp_checkExistingSubmission(
    IN p_stallholder_id INT,
    IN p_owner_id INT,
    IN p_requirement_id INT
)
BEGIN
    SELECT submission_id FROM stallholder_document_submissions 
    WHERE stallholder_id = p_stallholder_id 
      AND owner_id = p_owner_id 
      AND requirement_id = p_requirement_id;
END//

-- =====================================================
-- SP: sp_updateSubmissionBlob
-- Purpose: Update existing document submission BLOB
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateSubmissionBlob//
CREATE PROCEDURE sp_updateSubmissionBlob(
    IN p_submission_id INT,
    IN p_file_path VARCHAR(500),
    IN p_original_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_document_data LONGBLOB
)
BEGIN
    UPDATE stallholder_document_submissions 
    SET file_path = p_file_path,
        original_filename = p_original_filename,
        file_size = p_file_size,
        document_data = p_document_data,
        storage_type = 'blob',
        submission_date = NOW(),
        verification_status = 'pending',
        verified_by = NULL,
        verified_at = NULL,
        rejection_reason = NULL
    WHERE submission_id = p_submission_id;
    
    SELECT p_submission_id as submission_id;
END//

-- =====================================================
-- SP: sp_insertSubmissionBlob
-- Purpose: Insert new document submission BLOB
-- =====================================================
DROP PROCEDURE IF EXISTS sp_insertSubmissionBlob//
CREATE PROCEDURE sp_insertSubmissionBlob(
    IN p_stallholder_id INT,
    IN p_owner_id INT,
    IN p_requirement_id INT,
    IN p_application_id INT,
    IN p_file_path VARCHAR(500),
    IN p_original_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_document_data LONGBLOB
)
BEGIN
    INSERT INTO stallholder_document_submissions (
        stallholder_id, owner_id, requirement_id, application_id,
        file_path, original_filename, file_size,
        document_data, storage_type, verification_status
    ) VALUES (
        p_stallholder_id, p_owner_id, p_requirement_id, p_application_id,
        p_file_path, p_original_filename, p_file_size,
        p_document_data, 'blob', 'pending'
    );
    
    SELECT LAST_INSERT_ID() as submission_id;
END//

-- =====================================================
-- SP: sp_getDocumentByStallholderType
-- Purpose: Get document by stallholder and type
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getDocumentByStallholderType//
CREATE PROCEDURE sp_getDocumentByStallholderType(
    IN p_stallholder_id INT,
    IN p_document_type_id INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.stallholder_id,
        sd.document_type_id,
        dt.document_name,
        sd.file_path,
        sd.original_filename,
        sd.file_size,
        sd.document_data,
        sd.storage_type,
        sd.upload_date,
        sd.verification_status,
        sd.expiry_date
    FROM stallholder_documents sd
    LEFT JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    WHERE sd.stallholder_id = p_stallholder_id 
      AND sd.document_type_id = p_document_type_id;
END//

-- =====================================================
-- SP: sp_getDocumentById
-- Purpose: Get document by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getDocumentBlobById//
CREATE PROCEDURE sp_getDocumentBlobById(
    IN p_document_id INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.stallholder_id,
        sd.document_type_id,
        dt.document_name,
        sd.file_path,
        sd.original_filename,
        sd.file_size,
        sd.document_data,
        sd.storage_type,
        sd.upload_date,
        sd.verification_status
    FROM stallholder_documents sd
    LEFT JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    WHERE sd.document_id = p_document_id;
END//

-- =====================================================
-- SP: sp_getSubmissionById
-- Purpose: Get submission by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getSubmissionBlobById//
CREATE PROCEDURE sp_getSubmissionBlobById(
    IN p_submission_id INT
)
BEGIN
    SELECT 
        sds.submission_id,
        sds.stallholder_id,
        sds.owner_id,
        sds.requirement_id,
        sds.application_id,
        odr.document_name,
        sds.file_path,
        sds.original_filename,
        sds.file_size,
        sds.document_data,
        sds.storage_type,
        sds.submission_date,
        sds.verification_status
    FROM stallholder_document_submissions sds
    LEFT JOIN owner_document_requirements odr ON sds.requirement_id = odr.requirement_id
    WHERE sds.submission_id = p_submission_id;
END//

-- =====================================================
-- SP: sp_getDocumentsByStallholder
-- Purpose: Get all documents for a stallholder
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getDocumentsByStallholder//
CREATE PROCEDURE sp_getDocumentsByStallholder(
    IN p_stallholder_id INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.document_type_id,
        dt.document_name,
        sd.file_path,
        sd.original_filename,
        sd.file_size,
        sd.storage_type,
        sd.upload_date,
        sd.verification_status,
        sd.expiry_date,
        sd.notes,
        sd.verified_at,
        sd.rejection_reason
    FROM stallholder_documents sd
    LEFT JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    WHERE sd.stallholder_id = p_stallholder_id
    ORDER BY sd.upload_date DESC;
END//

-- =====================================================
-- SP: sp_verifyDocumentExists
-- Purpose: Check if document exists
-- =====================================================
DROP PROCEDURE IF EXISTS sp_verifyDocumentExists//
CREATE PROCEDURE sp_verifyDocumentExists(
    IN p_document_id INT
)
BEGIN
    SELECT document_id FROM stallholder_documents WHERE document_id = p_document_id;
END//

-- =====================================================
-- SP: sp_deleteDocumentById
-- Purpose: Delete a document by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_deleteDocumentById//
CREATE PROCEDURE sp_deleteDocumentById(
    IN p_document_id INT
)
BEGIN
    DELETE FROM stallholder_documents WHERE document_id = p_document_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_verifyStallExists
-- Purpose: Check if stall exists (for mobile image controller)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_verifyStallExistsMobile//
CREATE PROCEDURE sp_verifyStallExistsMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT stall_id FROM stall WHERE stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_getStallImageCountMobile
-- Purpose: Get count of images for a stall
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallImageCountMobile//
CREATE PROCEDURE sp_getStallImageCountMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT COUNT(*) as count FROM stall_images WHERE stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_getNextStallImageOrderMobile
-- Purpose: Get next display order for stall images
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getNextStallImageOrderMobile//
CREATE PROCEDURE sp_getNextStallImageOrderMobile(
    IN p_stall_id INT
)
BEGIN
    SELECT COALESCE(MAX(display_order), 0) + 1 as next_order FROM stall_images WHERE stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_unsetStallPrimaryImagesMobile
-- Purpose: Unset all primary images for a stall
-- =====================================================
DROP PROCEDURE IF EXISTS sp_unsetStallPrimaryImagesMobile//
CREATE PROCEDURE sp_unsetStallPrimaryImagesMobile(
    IN p_stall_id INT
)
BEGIN
    UPDATE stall_images SET is_primary = 0 WHERE stall_id = p_stall_id;
END//

-- =====================================================
-- SP: sp_insertStallImageBlobMobile
-- Purpose: Insert new stall image blob
-- =====================================================
DROP PROCEDURE IF EXISTS sp_insertStallImageBlobMobile//
CREATE PROCEDURE sp_insertStallImageBlobMobile(
    IN p_stall_id INT,
    IN p_image_url VARCHAR(500),
    IN p_image_data LONGBLOB,
    IN p_mime_type VARCHAR(50),
    IN p_file_name VARCHAR(255),
    IN p_is_primary BOOLEAN,
    IN p_display_order INT
)
BEGIN
    INSERT INTO stall_images (
        stall_id, image_url, image_data, mime_type, file_name,
        is_primary, display_order, storage_type, created_at
    ) VALUES (
        p_stall_id, p_image_url, p_image_data, p_mime_type, p_file_name,
        p_is_primary, p_display_order, 'blob', NOW()
    );
    
    SELECT LAST_INSERT_ID() as id;
END//

DELIMITER ;

-- Success message
SELECT 'Mobile Document BLOB Controller stored procedures created successfully' as status;
