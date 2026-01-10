-- PROCEDURE 3: sp_getDocumentById
-- Get single document details

DELIMITER //

DROP PROCEDURE IF EXISTS `sp_getDocumentById`//

CREATE PROCEDURE `sp_getDocumentById` (
    IN `p_document_id` INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.email as stallholder_email,
        sh.contact_number as stallholder_phone,
        sh.address as stallholder_address,
        sh.branch_id,
        b.branch_name,
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
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id
    WHERE sd.document_id = p_document_id;
END//

DELIMITER ;
