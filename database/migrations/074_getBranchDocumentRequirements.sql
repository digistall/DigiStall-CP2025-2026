-- Migration: 074_getBranchDocumentRequirements.sql
-- Description: getBranchDocumentRequirements stored procedure
-- Date: Generated from naga_stall.sql

DELIMITER $$

DROP PROCEDURE IF EXISTS `getBranchDocumentRequirements`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBranchDocumentRequirements` (IN `p_branch_id` INT)   BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        dt.document_type_id,
        dt.document_name,
        dt.description,
        bdr.is_required,
        bdr.instructions,
        bdr.created_at,
        bdr.created_by_business_manager,
        COALESCE(
            CONCAT(bm.first_name, ' ', bm.last_name),
            CONCAT(sbo.first_name, ' ', sbo.last_name),
            'System'
        ) as created_by_name
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON bdr.created_by_business_manager = bm.business_manager_id
    LEFT JOIN stall_business_owner sbo ON bdr.created_by_business_manager = sbo.business_owner_id
    WHERE bdr.branch_id = p_branch_id
    ORDER BY dt.document_name;
END$$

DELIMITER ;
