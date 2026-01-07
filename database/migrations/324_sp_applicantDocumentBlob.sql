-- =============================================
-- APPLICANT DOCUMENT BLOB STORED PROCEDURES
-- Migration: 324_sp_applicantDocumentBlob.sql
-- Purpose: Convert raw SQL queries in applicantDocumentBlobController.js to stored procedures
-- =============================================

DELIMITER //

-- =============================================
-- CHECK IF APPLICANT EXISTS
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkApplicantExists//
CREATE PROCEDURE sp_checkApplicantExists(
    IN p_applicant_id INT
)
BEGIN
    SELECT applicant_id FROM applicant WHERE applicant_id = p_applicant_id;
END//

-- =============================================
-- CHECK EXISTING APPLICANT DOCUMENT
-- =============================================
DROP PROCEDURE IF EXISTS sp_checkExistingApplicantDocument//
CREATE PROCEDURE sp_checkExistingApplicantDocument(
    IN p_applicant_id INT,
    IN p_business_owner_id INT,
    IN p_document_type_id INT
)
BEGIN
    SELECT document_id 
    FROM applicant_documents 
    WHERE applicant_id = p_applicant_id 
      AND business_owner_id = p_business_owner_id 
      AND document_type_id = p_document_type_id;
END//

-- =============================================
-- UPDATE APPLICANT DOCUMENT BLOB
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateApplicantDocumentBlob//
CREATE PROCEDURE sp_updateApplicantDocumentBlob(
    IN p_document_id INT,
    IN p_file_path VARCHAR(500),
    IN p_original_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_mime_type VARCHAR(100),
    IN p_document_data LONGBLOB,
    IN p_expiry_date DATE,
    IN p_notes TEXT
)
BEGIN
    UPDATE applicant_documents 
    SET file_path = p_file_path,
        original_filename = p_original_filename,
        file_size = p_file_size,
        mime_type = p_mime_type,
        document_data = p_document_data,
        storage_type = 'blob',
        upload_date = NOW(),
        verification_status = 'pending',
        verified_by = NULL,
        verified_at = NULL,
        rejection_reason = NULL,
        expiry_date = p_expiry_date,
        notes = p_notes,
        updated_at = NOW()
    WHERE document_id = p_document_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =============================================
-- INSERT APPLICANT DOCUMENT BLOB
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertApplicantDocumentBlob//
CREATE PROCEDURE sp_insertApplicantDocumentBlob(
    IN p_applicant_id INT,
    IN p_business_owner_id INT,
    IN p_branch_id INT,
    IN p_document_type_id INT,
    IN p_file_path VARCHAR(500),
    IN p_original_filename VARCHAR(255),
    IN p_file_size INT,
    IN p_mime_type VARCHAR(100),
    IN p_document_data LONGBLOB,
    IN p_expiry_date DATE,
    IN p_notes TEXT
)
BEGIN
    INSERT INTO applicant_documents (
        applicant_id, business_owner_id, branch_id, document_type_id,
        file_path, original_filename, file_size, mime_type,
        document_data, storage_type, expiry_date, notes, verification_status
    ) VALUES (
        p_applicant_id, p_business_owner_id, p_branch_id, p_document_type_id,
        p_file_path, p_original_filename, p_file_size, p_mime_type,
        p_document_data, 'blob', p_expiry_date, p_notes, 'pending'
    );
    
    SELECT LAST_INSERT_ID() as document_id;
END//

-- =============================================
-- GET APPLICANT DOCUMENT BLOB BY TYPE
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantDocumentBlob//
CREATE PROCEDURE sp_getApplicantDocumentBlob(
    IN p_applicant_id INT,
    IN p_document_type_id INT,
    IN p_business_owner_id INT
)
BEGIN
    SELECT document_data, mime_type, original_filename 
    FROM applicant_documents 
    WHERE applicant_id = p_applicant_id 
      AND document_type_id = p_document_type_id 
      AND storage_type = 'blob' 
      AND document_data IS NOT NULL
      AND (p_business_owner_id IS NULL OR business_owner_id = p_business_owner_id)
    ORDER BY upload_date DESC 
    LIMIT 1;
END//

-- =============================================
-- GET APPLICANT DOCUMENT BLOB BY ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantDocumentBlobById//
CREATE PROCEDURE sp_getApplicantDocumentBlobById(
    IN p_document_id INT
)
BEGIN
    SELECT document_data, mime_type, original_filename 
    FROM applicant_documents 
    WHERE document_id = p_document_id 
      AND storage_type = 'blob' 
      AND document_data IS NOT NULL;
END//

-- =============================================
-- GET ALL APPLICANT DOCUMENTS (without data)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllApplicantDocuments//
CREATE PROCEDURE sp_getAllApplicantDocuments(
    IN p_applicant_id INT,
    IN p_business_owner_id INT
)
BEGIN
    SELECT 
        ad.document_id, ad.applicant_id, ad.business_owner_id, ad.branch_id,
        ad.document_type_id, dt.document_name, dt.description as document_description,
        ad.file_path, ad.original_filename, ad.file_size, ad.mime_type,
        ad.upload_date, ad.verification_status, ad.verified_at, ad.verified_by,
        ad.rejection_reason, ad.expiry_date, ad.notes, ad.storage_type
    FROM applicant_documents ad
    LEFT JOIN document_types dt ON ad.document_type_id = dt.document_type_id
    WHERE ad.applicant_id = p_applicant_id
      AND (p_business_owner_id IS NULL OR ad.business_owner_id = p_business_owner_id)
    ORDER BY dt.document_name ASC, ad.upload_date DESC;
END//

-- =============================================
-- GET ALL APPLICANT DOCUMENTS (with base64 data)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllApplicantDocumentsWithData//
CREATE PROCEDURE sp_getAllApplicantDocumentsWithData(
    IN p_applicant_id INT,
    IN p_business_owner_id INT
)
BEGIN
    SELECT 
        ad.document_id, ad.applicant_id, ad.business_owner_id, ad.branch_id,
        ad.document_type_id, dt.document_name, dt.description as document_description,
        ad.file_path, ad.original_filename, ad.file_size, ad.mime_type,
        ad.upload_date, ad.verification_status, ad.verified_at, ad.verified_by,
        ad.rejection_reason, ad.expiry_date, ad.notes, ad.storage_type,
        TO_BASE64(ad.document_data) as document_data_base64
    FROM applicant_documents ad
    LEFT JOIN document_types dt ON ad.document_type_id = dt.document_type_id
    WHERE ad.applicant_id = p_applicant_id
      AND (p_business_owner_id IS NULL OR ad.business_owner_id = p_business_owner_id)
    ORDER BY dt.document_name ASC, ad.upload_date DESC;
END//

-- =============================================
-- DELETE APPLICANT DOCUMENT
-- =============================================
DROP PROCEDURE IF EXISTS sp_deleteApplicantDocumentBlob//
CREATE PROCEDURE sp_deleteApplicantDocumentBlob(
    IN p_document_id INT
)
BEGIN
    -- First check if document exists
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM applicant_documents WHERE document_id = p_document_id;
    
    IF v_exists > 0 THEN
        DELETE FROM applicant_documents WHERE document_id = p_document_id;
        SELECT 1 as success, 'Document deleted successfully' as message;
    ELSE
        SELECT 0 as success, 'Document not found' as message;
    END IF;
END//

-- =============================================
-- UPDATE DOCUMENT VERIFICATION STATUS
-- =============================================
DROP PROCEDURE IF EXISTS sp_updateApplicantDocumentVerification//
CREATE PROCEDURE sp_updateApplicantDocumentVerification(
    IN p_document_id INT,
    IN p_verification_status VARCHAR(20),
    IN p_rejection_reason TEXT,
    IN p_verified_by INT
)
BEGIN
    -- First check if document exists
    DECLARE v_exists INT DEFAULT 0;
    SELECT COUNT(*) INTO v_exists FROM applicant_documents WHERE document_id = p_document_id;
    
    IF v_exists > 0 THEN
        UPDATE applicant_documents 
        SET verification_status = p_verification_status,
            rejection_reason = p_rejection_reason,
            verified_by = p_verified_by,
            verified_at = NOW(),
            updated_at = NOW()
        WHERE document_id = p_document_id;
        
        SELECT 1 as success, 'Verification status updated' as message;
    ELSE
        SELECT 0 as success, 'Document not found' as message;
    END IF;
END//

-- =============================================
-- GET DOCUMENT TYPE BY NAME
-- =============================================
DROP PROCEDURE IF EXISTS sp_getDocumentTypeByName//
CREATE PROCEDURE sp_getDocumentTypeByName(
    IN p_document_type VARCHAR(100)
)
BEGIN
    SELECT document_type_id 
    FROM document_types 
    WHERE LOWER(document_name) LIKE CONCAT('%', LOWER(p_document_type), '%');
END//

-- =============================================
-- GET APPLICANT DOCUMENT BY TYPE (extended)
-- =============================================
DROP PROCEDURE IF EXISTS sp_getApplicantDocumentByTypeExtended//
CREATE PROCEDURE sp_getApplicantDocumentByTypeExtended(
    IN p_applicant_id INT,
    IN p_document_type_id INT,
    IN p_business_owner_id INT,
    IN p_branch_id INT
)
BEGIN
    SELECT ad.document_id, ad.document_data, ad.mime_type, ad.original_filename,
           ad.verification_status, ad.storage_type, ad.file_path
    FROM applicant_documents ad
    WHERE ad.applicant_id = p_applicant_id 
      AND ad.document_type_id = p_document_type_id
      AND (p_business_owner_id IS NULL OR ad.business_owner_id = p_business_owner_id)
      AND (p_branch_id IS NULL OR ad.branch_id = p_branch_id)
    ORDER BY ad.upload_date DESC 
    LIMIT 1;
END//

DELIMITER ;
