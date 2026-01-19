-- ========================================
-- UPDATE STORED PROCEDURES FOR NEW DOCUMENT TYPES STRUCTURE
-- ========================================
-- This updates procedures to work with the new document_types table structure

-- Update getBranchDocumentRequirements to use new table structure with JOIN
DROP PROCEDURE IF EXISTS getBranchDocumentRequirements;

CREATE PROCEDURE getBranchDocumentRequirements(IN p_branch_id INT)
BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        bdr.document_type_id,
        dt.type_name,
        dt.description,
        dt.category,
        bdr.is_required,
        bdr.instructions,
        bdr.created_by_business_manager,
        bdr.created_at,
        bdr.updated_at
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    WHERE bdr.branch_id = p_branch_id AND dt.status = 'Active'
    ORDER BY dt.display_order, dt.type_name;
END;

