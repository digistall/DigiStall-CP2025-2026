-- PROCEDURE 1: sp_getDocumentsByStallholderId
-- Run this AFTER selecting the database

DELIMITER //

DROP PROCEDURE IF EXISTS `sp_getDocumentsByStallholderId`//

CREATE PROCEDURE `sp_getDocumentsByStallholderId` (
    IN `p_stallholder_id` INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.email as stallholder_email,
        sh.contact_number as stallholder_phone,
        st.stall_no,
        st.stall_location,
        sd.document_type_id,
        dt.document_name,
        dt.description as document_description,
        sd.file_path,
        sd.original_filename,
        sd.file_size,
        sd.upload_date,
        sd.verification_status as status,
        sd.verified_by as reviewed_by,
        sd.verified_at as reviewed_at,
        sd.rejection_reason,
        sd.expiry_date,
        sd.notes,
        CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
    FROM stallholder_documents sd
    INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id
    WHERE sd.stallholder_id = p_stallholder_id
    ORDER BY sd.upload_date DESC;
END//

DELIMITER ;
