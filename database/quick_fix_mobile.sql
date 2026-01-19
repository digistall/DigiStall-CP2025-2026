-- Quick fix for mobile document procedures
-- Execute this directly in MySQL

DROP PROCEDURE IF EXISTS sp_getBranchDocRequirementsFull;

CREATE PROCEDURE sp_getBranchDocRequirementsFull(IN p_branch_id INT)
BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        bdr.document_type_id,
        bdr.is_required,
        bdr.instructions,
        dt.type_name as document_name,
        dt.description as document_description,
        dt.category,
        dt.display_order
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    WHERE bdr.branch_id = p_branch_id AND dt.status = 'Active'
    ORDER BY bdr.is_required DESC, dt.display_order ASC, dt.type_name ASC;
END;
