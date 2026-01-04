-- Migration 319: Stallholder Document Stored Procedures
-- This creates stored procedures for stallholder document operations

DELIMITER //

-- =====================================================
-- SP: sp_getStallholderStallsForDocuments
-- Purpose: Get stallholder stalls for document management
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallholderStallsForDocuments//
CREATE PROCEDURE sp_getStallholderStallsForDocuments(
    IN p_applicant_id INT
)
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name as stallholder_business_name,
        sh.business_type as stallholder_business_type,
        sh.branch_id,
        sh.stall_id,
        sh.contract_status,
        sh.compliance_status,
        s.stall_no as stall_name,
        s.stall_no as stall_number,
        s.size,
        s.rental_price as price,
        s.price_type,
        b.branch_name,
        b.area as branch_area,
        b.location as branch_location,
        b.business_owner_id,
        '' as owner_first_name,
        '' as owner_last_name,
        '' as business_owner_name
    FROM stallholder sh
    INNER JOIN stall s ON sh.stall_id = s.stall_id
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    WHERE sh.applicant_id = p_applicant_id AND sh.contract_status = 'Active'
    ORDER BY b.branch_name, s.stall_no;
END//

-- =====================================================
-- SP: sp_getBranchDocRequirementsFull
-- Purpose: Get document requirements for a branch with full details
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchDocRequirementsFull//
CREATE PROCEDURE sp_getBranchDocRequirementsFull(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        bdr.document_type_id,
        bdr.is_required,
        bdr.instructions,
        dt.document_name,
        dt.description as document_description
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    WHERE bdr.branch_id = p_branch_id
    ORDER BY bdr.is_required DESC, dt.document_name ASC;
END//

-- =====================================================
-- SP: sp_getStallholderUploadedDocuments
-- Purpose: Get uploaded documents for stallholders
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getStallholderUploadedDocuments//
CREATE PROCEDURE sp_getStallholderUploadedDocuments(
    IN p_stallholder_ids TEXT
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            sd.document_id,
            sd.stallholder_id,
            sd.document_type_id,
            sd.file_path,
            sd.original_filename,
            sd.upload_date,
            sd.verification_status,
            sd.verified_at,
            sd.expiry_date,
            sd.rejection_reason,
            DATEDIFF(sd.expiry_date, CURDATE()) as days_until_expiry
        FROM stallholder_documents sd
        WHERE sd.stallholder_id IN (', p_stallholder_ids, ')
        ORDER BY sd.upload_date DESC
    ');
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_uploadStallholderDocument
-- Purpose: Upload or update a stallholder document
-- =====================================================
DROP PROCEDURE IF EXISTS sp_uploadStallholderDocument//
CREATE PROCEDURE sp_uploadStallholderDocument(
    IN p_stallholder_id INT,
    IN p_document_type_id INT,
    IN p_file_path VARCHAR(500),
    IN p_original_filename VARCHAR(255),
    IN p_file_size INT
)
BEGIN
    DECLARE v_existing_id INT DEFAULT NULL;
    
    -- Check if document already exists
    SELECT document_id INTO v_existing_id
    FROM stallholder_documents
    WHERE stallholder_id = p_stallholder_id AND document_type_id = p_document_type_id
    LIMIT 1;
    
    IF v_existing_id IS NOT NULL THEN
        -- Update existing document
        UPDATE stallholder_documents
        SET file_path = p_file_path,
            original_filename = p_original_filename,
            file_size = p_file_size,
            upload_date = NOW(),
            verification_status = 'pending',
            verified_by = NULL,
            verified_at = NULL,
            rejection_reason = NULL
        WHERE document_id = v_existing_id;
        
        SELECT v_existing_id as document_id, 'updated' as action;
    ELSE
        -- Insert new document
        INSERT INTO stallholder_documents (stallholder_id, document_type_id, file_path, original_filename, file_size, upload_date, verification_status)
        VALUES (p_stallholder_id, p_document_type_id, p_file_path, p_original_filename, p_file_size, NOW(), 'pending');
        
        SELECT LAST_INSERT_ID() as document_id, 'inserted' as action;
    END IF;
END//

-- =====================================================
-- SP: sp_getBusinessOwnerBranches
-- Purpose: Get branches owned by a business owner
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerBranches//
CREATE PROCEDURE sp_getBusinessOwnerBranches(
    IN p_business_owner_id INT
)
BEGIN
    SELECT DISTINCT b.branch_id, b.branch_name, b.area, b.location
    FROM business_owner_managers bom
    INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
    INNER JOIN branch b ON bm.branch_id = b.branch_id
    WHERE bom.business_owner_id = p_business_owner_id AND bom.status = 'Active' AND b.status = 'Active'
    ORDER BY b.branch_name;
END//

-- =====================================================
-- SP: sp_getBusinessOwnerBranchesWithManagers
-- Purpose: Get branches with their manager IDs for business owner
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerBranchesWithManagers//
CREATE PROCEDURE sp_getBusinessOwnerBranchesWithManagers(
    IN p_business_owner_id INT
)
BEGIN
    SELECT DISTINCT bm.branch_id, bm.business_manager_id
    FROM business_owner_managers bom
    INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
    INNER JOIN branch b ON bm.branch_id = b.branch_id
    WHERE bom.business_owner_id = p_business_owner_id AND bom.status = 'Active' AND b.status = 'Active'
    ORDER BY bm.branch_id;
END//

-- =====================================================
-- SP: sp_getDocumentTypes
-- Purpose: Get all document types
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getDocumentTypes//
CREATE PROCEDURE sp_getDocumentTypes()
BEGIN
    SELECT document_type_id, document_name, description, is_system_default
    FROM document_types
    ORDER BY document_name;
END//

-- =====================================================
-- SP: sp_getDocumentTypeById
-- Purpose: Get document type by requirement ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getDocumentTypeById//
CREATE PROCEDURE sp_getDocumentTypeById(
    IN p_requirement_id INT
)
BEGIN
    SELECT document_type_id 
    FROM branch_document_requirements 
    WHERE requirement_id = p_requirement_id;
END//

-- =====================================================
-- SP: sp_deleteBranchDocRequirements
-- Purpose: Delete all document requirements for a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_deleteBranchDocRequirements//
CREATE PROCEDURE sp_deleteBranchDocRequirements(
    IN p_branch_id INT
)
BEGIN
    DELETE FROM branch_document_requirements WHERE branch_id = p_branch_id;
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_bulkInsertBranchDocRequirements
-- Purpose: Insert multiple document requirements for branches
-- =====================================================
DROP PROCEDURE IF EXISTS sp_insertBranchDocRequirement//
CREATE PROCEDURE sp_insertBranchDocRequirement(
    IN p_branch_id INT,
    IN p_document_name VARCHAR(255),
    IN p_description TEXT,
    IN p_is_required BOOLEAN,
    IN p_instructions TEXT,
    IN p_manager_id INT
)
BEGIN
    INSERT INTO branch_document_requirements (branch_id, document_name, description, is_required, instructions, created_by)
    VALUES (p_branch_id, p_document_name, p_description, p_is_required, p_instructions, p_manager_id);
    
    SELECT LAST_INSERT_ID() as requirement_id;
END//

DELIMITER ;

-- Success message
SELECT 'Stallholder Document stored procedures created successfully' as status;
