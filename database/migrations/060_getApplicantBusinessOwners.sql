-- Migration: 060_getApplicantBusinessOwners.sql
-- Description: getApplicantBusinessOwners stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getApplicantBusinessOwners`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getApplicantBusinessOwners` (IN `p_applicant_id` INT)   BEGIN
    SELECT DISTINCT
        b.business_owner_id,
        CONCAT(bo.first_name, ' ', bo.last_name) as business_owner_name,
        bo.owner_username,
        bo.email,
        bo.contact_number,
        COUNT(DISTINCT app.application_id) as total_applications,
        COUNT(DISTINCT b.branch_id) as total_branches,
        GROUP_CONCAT(DISTINCT b.branch_name ORDER BY b.branch_name SEPARATOR ', ') as branch_names,
        -- Document statistics
        (SELECT COUNT(*) 
         FROM branch_document_requirements bdr 
         WHERE bdr.branch_id IN (
             SELECT DISTINCT br.branch_id 
             FROM application a
             INNER JOIN stall st ON a.stall_id = st.stall_id
             INNER JOIN section sc ON st.section_id = sc.section_id
             INNER JOIN floor fl ON sc.floor_id = fl.floor_id
             INNER JOIN branch br ON fl.branch_id = br.branch_id
             WHERE a.applicant_id = p_applicant_id 
             AND br.business_owner_id = b.business_owner_id
         )
         AND bdr.is_required = 1
        ) as required_documents_count,
        (SELECT COUNT(*) 
         FROM applicant_documents ad 
         WHERE ad.applicant_id = p_applicant_id 
         AND ad.business_owner_id = b.business_owner_id
         AND ad.verification_status = 'verified'
        ) as uploaded_documents_count
    FROM application app
    INNER JOIN stall s ON app.stall_id = s.stall_id
    INNER JOIN section sec ON s.section_id = sec.section_id
    INNER JOIN floor f ON sec.floor_id = f.floor_id
    INNER JOIN branch b ON f.branch_id = b.branch_id
    INNER JOIN stall_business_owner bo ON b.business_owner_id = bo.business_owner_id
    WHERE app.applicant_id = p_applicant_id
    GROUP BY b.business_owner_id, bo.first_name, bo.last_name, bo.owner_username, bo.email, bo.contact_number
    ORDER BY business_owner_name;
END$$

DELIMITER ;
