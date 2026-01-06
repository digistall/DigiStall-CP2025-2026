-- Migration: 102_GetStallholderDocuments.sql
-- Description: GetStallholderDocuments stored procedure
-- Date: Generated from naga_stall.sql
-- NOTE: Modified to use branch_id and branch_document_requirements for business_manager document management

DELIMITER $$

DROP PROCEDURE IF EXISTS `GetStallholderDocuments`$$

-- Modified: Now uses branch_id and branch_document_requirements for document management
CREATE DEFINER=`root`@`localhost` PROCEDURE `GetStallholderDocuments` (IN `p_stallholder_id` INT, IN `p_branch_id` INT)   BEGIN
    SELECT 
        ad.document_id as submission_id,
        bdr.requirement_id,
        dt.document_type_name as document_type,
        dt.document_type_name as document_name,
        bdr.is_required,
        ad.file_path as file_url,
        ad.original_filename as file_name,
        ad.mime_type as file_type,
        ad.file_size,
        ad.status,
        ad.rejection_reason,
        ad.uploaded_at,
        ad.reviewed_at,
        CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
    FROM applicant_documents ad
    INNER JOIN branch_document_requirements bdr ON ad.document_type_id = bdr.document_type_id
    INNER JOIN document_type dt ON bdr.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON ad.reviewed_by = bm.business_manager_id
    INNER JOIN stallholder sh ON ad.applicant_id = sh.applicant_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND bdr.branch_id = p_branch_id
    ORDER BY dt.document_type_name ASC;
END$$

DELIMITER ;
