-- Migration: 067_getApplicantRequiredDocuments.sql
-- Description: getApplicantRequiredDocuments stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantRequiredDocuments`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantRequiredDocuments` (IN `p_applicant_id` INT, IN `p_business_owner_id` INT)   BEGIN
    SELECT DISTINCT
        dt.document_type_id,
        dt.document_name,
        dt.description,
        MAX(bdr.is_required) as is_required,
        MAX(bdr.instructions) as instructions,
        ad.document_id,
        ad.file_path,
        ad.original_filename,
        ad.file_size,
        ad.upload_date,
        ad.verification_status,
        ad.verified_at,
        ad.expiry_date,
        ad.rejection_reason,
        ad.notes,
        CASE 
            WHEN ad.document_id IS NULL THEN 'not_uploaded'
            WHEN ad.expiry_date IS NOT NULL AND ad.expiry_date < CURDATE() THEN 'expired'
            WHEN ad.verification_status = 'verified' THEN 'verified'
            WHEN ad.verification_status = 'rejected' THEN 'rejected'
            ELSE 'pending'
        END as status,
        GROUP_CONCAT(DISTINCT b.branch_name ORDER BY b.branch_name SEPARATOR ', ') as applicable_branches
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN branch_document_requirements bdr ON b.branch_id = bdr.branch_id
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    LEFT JOIN applicant_documents ad ON p_applicant_id = ad.applicant_id 
        AND p_business_owner_id = ad.business_owner_id 
        AND dt.document_type_id = ad.document_type_id
    WHERE app.applicant_id = p_applicant_id
        AND b.business_owner_id = p_business_owner_id
    GROUP BY dt.document_type_id, dt.document_name, dt.description, 
             ad.document_id, ad.file_path, ad.original_filename, ad.file_size,
             ad.upload_date, ad.verification_status, ad.verified_at, ad.expiry_date,
             ad.rejection_reason, ad.notes
    ORDER BY MAX(bdr.is_required) DESC, dt.document_name;
END$$

DELIMITER ;
