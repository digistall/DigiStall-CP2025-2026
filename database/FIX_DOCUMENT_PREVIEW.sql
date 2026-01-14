-- =====================================================
-- FIX: Update stored procedure to include mime_type
-- Run this on DigitalOcean MySQL database
-- =====================================================

-- Select the database first
USE naga_stall;

DELIMITER //

DROP PROCEDURE IF EXISTS sp_getStallholderUploadedDocuments//
CREATE PROCEDURE sp_getStallholderUploadedDocuments(
    IN p_stallholder_ids TEXT
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            sd.document_id,
            sd.stallholder_id,
            sd.document_type_id,
            sd.file_path,
            sd.original_filename,
            sd.file_size,
            sd.upload_date,
            sd.verification_status,
            sd.verified_at,
            sd.expiry_date,
            sd.rejection_reason,
            DATEDIFF(sd.expiry_date, CURDATE()) as days_until_expiry,
            CASE 
                WHEN LOWER(sd.original_filename) LIKE ''%.jpg'' OR LOWER(sd.original_filename) LIKE ''%.jpeg'' THEN ''image/jpeg''
                WHEN LOWER(sd.original_filename) LIKE ''%.png'' THEN ''image/png''
                WHEN LOWER(sd.original_filename) LIKE ''%.gif'' THEN ''image/gif''
                WHEN LOWER(sd.original_filename) LIKE ''%.pdf'' THEN ''application/pdf''
                ELSE ''application/octet-stream''
            END as mime_type
        FROM stallholder_documents sd
        WHERE sd.stallholder_id IN (', p_stallholder_ids, ')
        ORDER BY sd.upload_date DESC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

DELIMITER ;

-- Verify the procedure was updated
SHOW CREATE PROCEDURE sp_getStallholderUploadedDocuments;
