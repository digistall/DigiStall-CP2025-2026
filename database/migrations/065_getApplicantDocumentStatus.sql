-- Migration: 065_getApplicantDocumentStatus.sql
-- Description: getApplicantDocumentStatus stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantDocumentStatus`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantDocumentStatus` (IN `p_applicant_id` INT, IN `p_business_owner_id` INT)   BEGIN
    SELECT 
        COUNT(DISTINCT bdr.document_type_id) as total_required_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.verification_status = 'verified' 
            THEN ad.document_type_id 
        END) as verified_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.document_id IS NOT NULL 
            THEN ad.document_type_id 
        END) as uploaded_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.verification_status = 'pending' 
            THEN ad.document_type_id 
        END) as pending_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.verification_status = 'rejected' 
            THEN ad.document_type_id 
        END) as rejected_documents,
        COUNT(DISTINCT CASE 
            WHEN ad.expiry_date IS NOT NULL AND ad.expiry_date < CURDATE() 
            THEN ad.document_type_id 
        END) as expired_documents,
        ROUND(
            (COUNT(DISTINCT CASE WHEN ad.verification_status = 'verified' THEN ad.document_type_id END) * 100.0) / 
            NULLIF(COUNT(DISTINCT bdr.document_type_id), 0), 
            2
        ) as completion_percentage
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN branch_document_requirements bdr ON b.branch_id = bdr.branch_id
    LEFT JOIN applicant_documents ad ON p_applicant_id = ad.applicant_id 
        AND p_business_owner_id = ad.business_owner_id 
        AND bdr.document_type_id = ad.document_type_id
    WHERE app.applicant_id = p_applicant_id
        AND b.business_owner_id = p_business_owner_id
        AND bdr.is_required = 1;
END$$

DELIMITER ;
