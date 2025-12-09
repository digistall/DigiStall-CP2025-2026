-- Migration: 249_uploadApplicantDocument.sql
-- Description: uploadApplicantDocument stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `uploadApplicantDocument`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `uploadApplicantDocument` (IN `p_applicant_id` INT, IN `p_business_owner_id` INT, IN `p_branch_id` INT, IN `p_document_type_id` INT, IN `p_file_path` VARCHAR(500), IN `p_original_filename` VARCHAR(255), IN `p_file_size` BIGINT, IN `p_mime_type` VARCHAR(100), IN `p_expiry_date` DATE, IN `p_notes` TEXT)   BEGIN
    DECLARE v_document_id INT;
    
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 0 as success, 'Error uploading document' as message;
    END;
    
    START TRANSACTION;
    
    -- Check if document already exists
    SELECT document_id INTO v_document_id
    FROM applicant_documents
    WHERE applicant_id = p_applicant_id
        AND business_owner_id = p_business_owner_id
        AND document_type_id = p_document_type_id;
    
    IF v_document_id IS NOT NULL THEN
        -- Update existing document
        UPDATE applicant_documents
        SET file_path = p_file_path,
            original_filename = p_original_filename,
            file_size = p_file_size,
            mime_type = p_mime_type,
            upload_date = NOW(),
            verification_status = 'pending',
            verified_by = NULL,
            verified_at = NULL,
            rejection_reason = NULL,
            expiry_date = p_expiry_date,
            notes = p_notes,
            updated_at = NOW()
        WHERE document_id = v_document_id;
        
        SELECT 1 as success, 'Document updated successfully' as message, v_document_id as document_id;
    ELSE
        -- Insert new document
        INSERT INTO applicant_documents (
            applicant_id, business_owner_id, branch_id, document_type_id,
            file_path, original_filename, file_size, mime_type,
            expiry_date, notes, verification_status
        ) VALUES (
            p_applicant_id, p_business_owner_id, p_branch_id, p_document_type_id,
            p_file_path, p_original_filename, p_file_size, p_mime_type,
            p_expiry_date, p_notes, 'pending'
        );
        
        SET v_document_id = LAST_INSERT_ID();
        
        SELECT 1 as success, 'Document uploaded successfully' as message, v_document_id as document_id;
    END IF;
    
    COMMIT;
END$$

DELIMITER ;
