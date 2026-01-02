-- =============================================
-- MOBILE STALLHOLDER DOCUMENT BLOB STORED PROCEDURES
-- Migration: 327_sp_mobileStallholderDocumentBlob.sql
-- Purpose: Convert raw SQL queries in Backend-Mobile/controllers/documents/stallholderDocumentBlobController.js to stored procedures
-- =============================================

DELIMITER //

-- =============================================
-- CHECK STALLHOLDER EXISTS
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkStallholderExistsMobile//
CREATE PROCEDURE sp_checkStallholderExistsMobile(
    IN p_stallholder_id INT
)
BEGIN
    SELECT stallholder_id FROM stallholder WHERE stallholder_id = p_stallholder_id;
END//

-- =============================================
-- CHECK EXISTING STALLHOLDER DOCUMENT
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkExistingStallholderDocument//
CREATE PROCEDURE sp_checkExistingStallholderDocument(
    IN p_stallholder_id INT,
    IN p_document_type_id INT
)
BEGIN
    SELECT document_id 
    FROM stallholder_documents 
    WHERE stallholder_id = p_stallholder_id AND document_type_id = p_document_type_id;
END//

-- =============================================
-- UPDATE STALLHOLDER DOCUMENT BLOB
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStallholderDocumentBlob//
CREATE PROCEDURE sp_updateStallholderDocumentBlob(
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
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =============================================
-- INSERT STALLHOLDER DOCUMENT BLOB
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertStallholderDocumentBlob//
CREATE PROCEDURE sp_insertStallholderDocumentBlob(
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

-- =============================================
-- CHECK EXISTING DOCUMENT SUBMISSION
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkExistingDocumentSubmission//
CREATE PROCEDURE sp_checkExistingDocumentSubmission(
    IN p_stallholder_id INT,
    IN p_requirement_id INT,
    IN p_owner_id INT
)
BEGIN
    SELECT submission_id 
    FROM stallholder_document_submissions 
    WHERE stallholder_id = p_stallholder_id 
      AND requirement_id = p_requirement_id 
      AND owner_id = p_owner_id;
END//

-- =============================================
-- UPDATE DOCUMENT SUBMISSION BLOB
-- =============================================
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
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =============================================
-- INSERT DOCUMENT SUBMISSION BLOB
-- =============================================
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

-- =============================================
-- GET STALLHOLDER DOCUMENT BLOB
-- =============================================
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

-- =============================================
-- GET STALLHOLDER DOCUMENT BY ID
-- =============================================
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

-- =============================================
-- GET DOCUMENT SUBMISSION BLOB
-- =============================================
DROP PROCEDURE IF EXISTS sp_getDocumentSubmissionBlob//
CREATE PROCEDURE sp_getDocumentSubmissionBlob(
    IN p_submission_id INT
)
BEGIN
    SELECT document_data, file_name, file_type
    FROM stallholder_document_submissions
    WHERE submission_id = p_submission_id 
      AND storage_type = 'blob' 
      AND document_data IS NOT NULL;
END//

-- =============================================
-- GET ALL STALLHOLDER DOCUMENTS (without data)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllStallholderDocuments//
CREATE PROCEDURE sp_getAllStallholderDocuments(
    IN p_stallholder_id INT
)
BEGIN
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
END//

-- =============================================
-- GET ALL STALLHOLDER DOCUMENTS (with base64 data)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllStallholderDocumentsWithData//
CREATE PROCEDURE sp_getAllStallholderDocumentsWithData(
    IN p_stallholder_id INT
)
BEGIN
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
END//

-- =============================================
-- DELETE STALLHOLDER DOCUMENT
-- =============================================
DROP PROCEDURE IF EXISTS sp_deleteStallholderDocument//
CREATE PROCEDURE sp_deleteStallholderDocument(
    IN p_document_id INT
)
BEGIN
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM stallholder_documents WHERE document_id = p_document_id;
    
    IF v_exists > 0 THEN
        DELETE FROM stallholder_documents WHERE document_id = p_document_id;
        SELECT 1 as success, 'Document deleted successfully' as message;
    ELSE
        SELECT 0 as success, 'Document not found' as message;
    END IF;
END//

-- =============================================
-- UPDATE STALLHOLDER DOCUMENT VERIFICATION STATUS
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateStallholderDocumentVerification//
CREATE PROCEDURE sp_updateStallholderDocumentVerification(
    IN p_document_id INT,
    IN p_verification_status VARCHAR(20),
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
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;
