-- Migration: 093_GetOwnerDocumentRequirements.sql
-- Description: GetOwnerDocumentRequirements stored procedure
-- Date: Generated from naga_stall.sql
-- NOTE: Modified to use business_manager_id for document customization by business managers

DELIMITER $$

DROP PROCEDURE IF EXISTS `GetOwnerDocumentRequirements`$$
DROP PROCEDURE IF EXISTS `GetManagerDocumentRequirements`$$

-- Renamed procedure to reflect business_manager control
CREATE DEFINER=`root`@`localhost` PROCEDURE `GetManagerDocumentRequirements` (IN `p_business_manager_id` INT)   BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        dt.document_type_id,
        dt.document_type_name as document_type,
        dt.document_type_name as document_name,
        dt.description,
        bdr.is_required,
        bdr.instructions,
        bdr.created_by_business_manager,
        bdr.created_at
    FROM branch_document_requirements bdr
    INNER JOIN document_type dt ON bdr.document_type_id = dt.document_type_id
    INNER JOIN branch b ON bdr.branch_id = b.branch_id
    INNER JOIN business_manager bm ON b.business_manager_id = bm.business_manager_id
    WHERE bm.business_manager_id = p_business_manager_id
    ORDER BY dt.document_type_name ASC;
END$$

DELIMITER ;
