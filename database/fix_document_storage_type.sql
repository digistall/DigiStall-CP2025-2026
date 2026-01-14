-- =============================================
-- FIX DOCUMENT STORAGE TYPE
-- Purpose: Update storage_type to 'blob' for documents that have blob data
-- Run this on the production database to fix the document retrieval issue
-- =============================================

-- First, check current state
SELECT 
    document_id, 
    stallholder_id,
    original_filename,
    storage_type,
    CASE WHEN document_data IS NOT NULL THEN 'HAS DATA' ELSE 'NO DATA' END as has_blob_data,
    file_size
FROM stallholder_documents;

-- Update storage_type to 'blob' for all documents that have document_data
-- Using document_id > 0 to satisfy safe update mode
UPDATE stallholder_documents 
SET storage_type = 'blob' 
WHERE document_id > 0
  AND document_data IS NOT NULL 
  AND (storage_type IS NULL OR storage_type != 'blob');

-- Verify the fix
SELECT 
    document_id, 
    stallholder_id,
    original_filename,
    storage_type,
    CASE WHEN document_data IS NOT NULL THEN 'HAS DATA' ELSE 'NO DATA' END as has_blob_data,
    file_size
FROM stallholder_documents;

-- Alternative: Update the stored procedure to not require storage_type = 'blob'
-- This is a more permanent fix
DELIMITER //

DROP PROCEDURE IF EXISTS sp_getStallholderDocumentBlobById//
CREATE PROCEDURE sp_getStallholderDocumentBlobById(
    IN p_document_id INT
)
BEGIN
    -- Removed storage_type = 'blob' filter to support all documents with blob data
    SELECT document_data, original_filename
    FROM stallholder_documents
    WHERE document_id = p_document_id 
      AND document_data IS NOT NULL;
END//

DELIMITER ;
