-- ================================================
-- FIX DOCUMENT REVIEW PROCEDURE
-- Fix sp_reviewStallholderDocument to use correct column name
-- and match ENUM values: 'Pending', 'Approved', 'Rejected'
-- Date: January 19, 2026
-- ================================================

DELIMITER //

DROP PROCEDURE IF EXISTS `sp_reviewStallholderDocument`//

CREATE PROCEDURE `sp_reviewStallholderDocument` (
    IN `p_document_id` INT,
    IN `p_status` VARCHAR(20),
    IN `p_rejection_reason` TEXT,
    IN `p_verified_by` INT
)
BEGIN
    DECLARE v_affected INT DEFAULT 0;
    DECLARE v_current_status VARCHAR(20);
    
    -- Check if document exists
    SELECT verification_status INTO v_current_status
    FROM stallholder_documents
    WHERE document_id = p_document_id;
    
    IF v_current_status IS NULL THEN
        SELECT 0 as success, 'Document not found' as message;
    ELSE
        -- Update document using 'remarks' column instead of 'rejection_reason'
        -- Note: verification_status ENUM values are: 'Pending', 'Approved', 'Rejected'
        UPDATE stallholder_documents
        SET 
            verification_status = p_status,
            remarks = CASE WHEN p_status = 'Rejected' THEN p_rejection_reason ELSE NULL END,
            verified_by = p_verified_by,
            verified_at = CURRENT_TIMESTAMP
        WHERE document_id = p_document_id;
        
        SET v_affected = ROW_COUNT();
        
        IF v_affected > 0 THEN
            SELECT 
                1 as success, 
                CONCAT('Document ', p_status, ' successfully') as message,
                p_document_id as document_id,
                p_status as new_status;
        ELSE
            SELECT 0 as success, 'Failed to update document' as message;
        END IF;
    END IF;
END//

DELIMITER ;

-- Verify the procedure was created
SELECT 'sp_reviewStallholderDocument procedure has been updated successfully' as status;
