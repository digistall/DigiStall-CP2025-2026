-- Migration: 250_stallholder_document_management.sql
-- Description: Comprehensive stored procedures for business_manager and business_employee 
--              to manage stallholder document requirements per branch
-- Date: December 9, 2025
-- NOTE: Each branch can have different document requirements for stallholders

DELIMITER $$

-- ============================================================
-- 1. ADD DOCUMENT REQUIREMENT TO BRANCH
-- Business manager adds a document requirement for their branch
-- ============================================================
DROP PROCEDURE IF EXISTS `addBranchDocumentRequirement`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addBranchDocumentRequirement` (
    IN `p_branch_id` INT, 
    IN `p_document_type_id` INT, 
    IN `p_is_required` TINYINT,
    IN `p_instructions` TEXT,
    IN `p_created_by_manager` INT
)   
BEGIN
    DECLARE v_existing INT DEFAULT 0;
    DECLARE v_manager_branch INT DEFAULT 0;
    
    -- Verify manager belongs to this branch
    SELECT branch_id INTO v_manager_branch
    FROM business_manager
    WHERE business_manager_id = p_created_by_manager
    LIMIT 1;
    
    IF v_manager_branch != p_branch_id AND v_manager_branch IS NOT NULL THEN
        SELECT 0 as success, 'Manager does not belong to this branch' as message;
    ELSE
        -- Check if requirement already exists
        SELECT COUNT(*) INTO v_existing
        FROM branch_document_requirements
        WHERE branch_id = p_branch_id AND document_type_id = p_document_type_id;
        
        IF v_existing > 0 THEN
            SELECT 0 as success, 'Document requirement already exists for this branch' as message;
        ELSE
            INSERT INTO branch_document_requirements (
                branch_id,
                document_type_id,
                is_required,
                instructions,
                created_by_business_manager,
                created_at
            ) VALUES (
                p_branch_id,
                p_document_type_id,
                COALESCE(p_is_required, 1),
                p_instructions,
                p_created_by_manager,
                CURRENT_TIMESTAMP
            );
            
            SELECT 
                1 as success,
                LAST_INSERT_ID() as requirement_id,
                'Document requirement added successfully' as message;
        END IF;
    END IF;
END$$

-- ============================================================
-- 2. UPDATE DOCUMENT REQUIREMENT FOR BRANCH
-- Business manager updates an existing document requirement
-- ============================================================
DROP PROCEDURE IF EXISTS `updateBranchDocumentRequirement`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `updateBranchDocumentRequirement` (
    IN `p_requirement_id` INT,
    IN `p_is_required` TINYINT,
    IN `p_instructions` TEXT,
    IN `p_updated_by_manager` INT
)   
BEGIN
    DECLARE v_affected INT DEFAULT 0;
    
    UPDATE branch_document_requirements
    SET 
        is_required = COALESCE(p_is_required, is_required),
        instructions = COALESCE(p_instructions, instructions),
        created_by_business_manager = p_updated_by_manager,
        updated_at = CURRENT_TIMESTAMP
    WHERE requirement_id = p_requirement_id;
    
    SET v_affected = ROW_COUNT();
    
    IF v_affected > 0 THEN
        SELECT 1 as success, 'Document requirement updated successfully' as message;
    ELSE
        SELECT 0 as success, 'Document requirement not found' as message;
    END IF;
END$$

-- ============================================================
-- 3. DELETE DOCUMENT REQUIREMENT FROM BRANCH
-- Business manager removes a document requirement
-- ============================================================
DROP PROCEDURE IF EXISTS `deleteBranchDocumentRequirement`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `deleteBranchDocumentRequirement` (
    IN `p_requirement_id` INT,
    IN `p_deleted_by_manager` INT
)   
BEGIN
    DECLARE v_affected INT DEFAULT 0;
    
    DELETE FROM branch_document_requirements
    WHERE requirement_id = p_requirement_id;
    
    SET v_affected = ROW_COUNT();
    
    IF v_affected > 0 THEN
        SELECT 1 as success, 'Document requirement deleted successfully' as message;
    ELSE
        SELECT 0 as success, 'Document requirement not found' as message;
    END IF;
END$$

-- ============================================================
-- 4. GET ALL DOCUMENT REQUIREMENTS FOR A BRANCH
-- Returns all document requirements configured for a specific branch
-- ============================================================
DROP PROCEDURE IF EXISTS `getBranchDocumentRequirements`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getBranchDocumentRequirements` (
    IN `p_branch_id` INT
)   
BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        b.branch_name,
        bdr.document_type_id,
        dt.document_name,
        dt.description as document_description,
        dt.is_system_default,
        bdr.is_required,
        bdr.instructions,
        bdr.created_by_business_manager,
        CONCAT(bm.first_name, ' ', bm.last_name) as created_by_name,
        bdr.created_at,
        bdr.updated_at
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    INNER JOIN branch b ON bdr.branch_id = b.branch_id
    LEFT JOIN business_manager bm ON bdr.created_by_business_manager = bm.business_manager_id
    WHERE bdr.branch_id = p_branch_id
    ORDER BY bdr.is_required DESC, dt.document_name ASC;
END$$

-- ============================================================
-- 5. GET DOCUMENT REQUIREMENTS BY BUSINESS MANAGER
-- Returns all document requirements for branches managed by a specific manager
-- ============================================================
DROP PROCEDURE IF EXISTS `getDocumentRequirementsByManager`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDocumentRequirementsByManager` (
    IN `p_business_manager_id` INT
)   
BEGIN
    SELECT 
        bdr.requirement_id,
        bdr.branch_id,
        b.branch_name,
        bdr.document_type_id,
        dt.document_name,
        dt.description as document_description,
        bdr.is_required,
        bdr.instructions,
        bdr.created_at,
        bdr.updated_at
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    INNER JOIN branch b ON bdr.branch_id = b.branch_id
    WHERE b.business_manager_id = p_business_manager_id
       OR bdr.created_by_business_manager = p_business_manager_id
    ORDER BY b.branch_name ASC, bdr.is_required DESC, dt.document_name ASC;
END$$

-- ============================================================
-- 6. GET ALL AVAILABLE DOCUMENT TYPES
-- Returns all document types that can be added as requirements
-- ============================================================
DROP PROCEDURE IF EXISTS `getAllDocumentTypes`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAllDocumentTypes` ()   
BEGIN
    SELECT 
        document_type_id,
        document_name,
        description,
        is_system_default,
        created_at
    FROM document_types
    ORDER BY is_system_default DESC, document_name ASC;
END$$

-- ============================================================
-- 7. GET AVAILABLE DOCUMENT TYPES FOR BRANCH
-- Returns document types not yet added to a specific branch
-- ============================================================
DROP PROCEDURE IF EXISTS `getAvailableDocumentTypesForBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getAvailableDocumentTypesForBranch` (
    IN `p_branch_id` INT
)   
BEGIN
    SELECT 
        dt.document_type_id,
        dt.document_name,
        dt.description,
        dt.is_system_default
    FROM document_types dt
    WHERE dt.document_type_id NOT IN (
        SELECT document_type_id 
        FROM branch_document_requirements 
        WHERE branch_id = p_branch_id
    )
    ORDER BY dt.is_system_default DESC, dt.document_name ASC;
END$$

-- ============================================================
-- 8. CREATE CUSTOM DOCUMENT TYPE
-- Business manager creates a custom document type for their branch
-- ============================================================
DROP PROCEDURE IF EXISTS `createCustomDocumentType`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `createCustomDocumentType` (
    IN `p_document_name` VARCHAR(100),
    IN `p_description` TEXT,
    IN `p_created_by_manager` INT
)   
BEGIN
    DECLARE v_existing INT DEFAULT 0;
    
    -- Check if document type already exists
    SELECT COUNT(*) INTO v_existing
    FROM document_types
    WHERE LOWER(document_name) = LOWER(p_document_name);
    
    IF v_existing > 0 THEN
        SELECT 0 as success, 'Document type with this name already exists' as message;
    ELSE
        INSERT INTO document_types (
            document_name,
            description,
            is_system_default,
            created_at
        ) VALUES (
            p_document_name,
            p_description,
            0, -- Custom documents are not system default
            CURRENT_TIMESTAMP
        );
        
        SELECT 
            1 as success,
            LAST_INSERT_ID() as document_type_id,
            'Custom document type created successfully' as message;
    END IF;
END$$

-- ============================================================
-- 9. GET STALLHOLDER DOCUMENT SUBMISSIONS
-- Returns all document submissions for a stallholder in a specific branch
-- ============================================================
DROP PROCEDURE IF EXISTS `getStallholderDocumentSubmissions`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholderDocumentSubmissions` (
    IN `p_stallholder_id` INT,
    IN `p_branch_id` INT
)   
BEGIN
    SELECT 
        ad.document_id,
        ad.applicant_id,
        sh.stallholder_id,
        sh.stallholder_name,
        bdr.requirement_id,
        bdr.document_type_id,
        dt.document_name,
        bdr.is_required,
        bdr.instructions,
        ad.file_path,
        ad.original_filename,
        ad.file_size,
        ad.mime_type,
        ad.verification_status as status,
        ad.rejection_reason,
        ad.uploaded_at,
        ad.verified_at as reviewed_at,
        CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
    FROM branch_document_requirements bdr
    INNER JOIN document_types dt ON bdr.document_type_id = dt.document_type_id
    INNER JOIN stallholder sh ON sh.branch_id = bdr.branch_id
    LEFT JOIN applicant_documents ad ON sh.applicant_id = ad.applicant_id 
        AND bdr.document_type_id = ad.document_type_id
    LEFT JOIN business_manager bm ON ad.verified_by = bm.business_manager_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND bdr.branch_id = p_branch_id
    ORDER BY bdr.is_required DESC, dt.document_name ASC;
END$$

-- ============================================================
-- 10. GET ALL STALLHOLDERS WITH DOCUMENT STATUS
-- Returns all stallholders in a branch with their document completion status
-- ============================================================
DROP PROCEDURE IF EXISTS `getStallholdersDocumentStatus`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getStallholdersDocumentStatus` (
    IN `p_branch_id` INT
)   
BEGIN
    SELECT 
        sh.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.contact_number,
        st.stall_no,
        (SELECT COUNT(*) 
         FROM branch_document_requirements 
         WHERE branch_id = p_branch_id AND is_required = 1) as total_required_docs,
        (SELECT COUNT(*) 
         FROM applicant_documents ad 
         WHERE ad.applicant_id = sh.applicant_id 
           AND ad.document_type_id IN (
               SELECT document_type_id 
               FROM branch_document_requirements 
               WHERE branch_id = p_branch_id AND is_required = 1
           )
           AND ad.verification_status = 'verified') as verified_docs,
        (SELECT COUNT(*) 
         FROM applicant_documents ad 
         WHERE ad.applicant_id = sh.applicant_id 
           AND ad.document_type_id IN (
               SELECT document_type_id 
               FROM branch_document_requirements 
               WHERE branch_id = p_branch_id
           )
           AND ad.verification_status = 'pending') as pending_docs,
        CASE 
            WHEN (SELECT COUNT(*) 
                  FROM applicant_documents ad 
                  WHERE ad.applicant_id = sh.applicant_id 
                    AND ad.document_type_id IN (
                        SELECT document_type_id 
                        FROM branch_document_requirements 
                        WHERE branch_id = p_branch_id AND is_required = 1
                    )
                    AND ad.verification_status = 'verified') = 
                 (SELECT COUNT(*) 
                  FROM branch_document_requirements 
                  WHERE branch_id = p_branch_id AND is_required = 1)
            THEN 'Complete'
            ELSE 'Incomplete'
        END as document_status
    FROM stallholder sh
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    WHERE sh.branch_id = p_branch_id
    ORDER BY sh.stallholder_name ASC;
END$$

-- ============================================================
-- 11. VERIFY STALLHOLDER DOCUMENT
-- Business manager/employee verifies a submitted document
-- ============================================================
DROP PROCEDURE IF EXISTS `verifyStallholderDocument`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `verifyStallholderDocument` (
    IN `p_document_id` INT,
    IN `p_status` VARCHAR(20),  -- 'verified', 'rejected', 'pending'
    IN `p_rejection_reason` TEXT,
    IN `p_verified_by` INT
)   
BEGIN
    DECLARE v_affected INT DEFAULT 0;
    
    UPDATE applicant_documents
    SET 
        verification_status = p_status,
        rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
        verified_by = p_verified_by,
        verified_at = CASE WHEN p_status IN ('verified', 'rejected') THEN CURRENT_TIMESTAMP ELSE verified_at END
    WHERE document_id = p_document_id;
    
    SET v_affected = ROW_COUNT();
    
    IF v_affected > 0 THEN
        SELECT 1 as success, CONCAT('Document ', p_status, ' successfully') as message;
    ELSE
        SELECT 0 as success, 'Document not found' as message;
    END IF;
END$$

-- ============================================================
-- 12. BULK ADD DEFAULT DOCUMENTS TO BRANCH
-- Adds all system default document types to a branch
-- ============================================================
DROP PROCEDURE IF EXISTS `addDefaultDocumentsToBranch`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `addDefaultDocumentsToBranch` (
    IN `p_branch_id` INT,
    IN `p_created_by_manager` INT
)   
BEGIN
    DECLARE v_added INT DEFAULT 0;
    
    INSERT INTO branch_document_requirements (
        branch_id, 
        document_type_id, 
        is_required, 
        instructions,
        created_by_business_manager, 
        created_at
    )
    SELECT 
        p_branch_id,
        dt.document_type_id,
        1, -- Required by default
        dt.description,
        p_created_by_manager,
        CURRENT_TIMESTAMP
    FROM document_types dt
    WHERE dt.is_system_default = 1
      AND dt.document_type_id NOT IN (
          SELECT document_type_id 
          FROM branch_document_requirements 
          WHERE branch_id = p_branch_id
      );
    
    SET v_added = ROW_COUNT();
    
    SELECT 
        1 as success,
        v_added as documents_added,
        'Default documents added to branch successfully' as message;
END$$

-- ============================================================
-- 13. COPY DOCUMENT REQUIREMENTS FROM ANOTHER BRANCH
-- Copies all document requirements from one branch to another
-- ============================================================
DROP PROCEDURE IF EXISTS `copyBranchDocumentRequirements`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `copyBranchDocumentRequirements` (
    IN `p_source_branch_id` INT,
    IN `p_target_branch_id` INT,
    IN `p_created_by_manager` INT
)   
BEGIN
    DECLARE v_copied INT DEFAULT 0;
    
    INSERT INTO branch_document_requirements (
        branch_id, 
        document_type_id, 
        is_required, 
        instructions,
        created_by_business_manager, 
        created_at
    )
    SELECT 
        p_target_branch_id,
        bdr.document_type_id,
        bdr.is_required,
        bdr.instructions,
        p_created_by_manager,
        CURRENT_TIMESTAMP
    FROM branch_document_requirements bdr
    WHERE bdr.branch_id = p_source_branch_id
      AND bdr.document_type_id NOT IN (
          SELECT document_type_id 
          FROM branch_document_requirements 
          WHERE branch_id = p_target_branch_id
      );
    
    SET v_copied = ROW_COUNT();
    
    SELECT 
        1 as success,
        v_copied as requirements_copied,
        'Document requirements copied successfully' as message;
END$$

-- ============================================================
-- 14. GET DOCUMENT REQUIREMENTS SUMMARY BY BRANCH
-- Returns a summary of document requirements across all branches
-- ============================================================
DROP PROCEDURE IF EXISTS `getDocumentRequirementsSummary`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `getDocumentRequirementsSummary` ()   
BEGIN
    SELECT 
        b.branch_id,
        b.branch_name,
        b.area,
        COUNT(bdr.requirement_id) as total_requirements,
        SUM(CASE WHEN bdr.is_required = 1 THEN 1 ELSE 0 END) as required_documents,
        SUM(CASE WHEN bdr.is_required = 0 THEN 1 ELSE 0 END) as optional_documents,
        CONCAT(bm.first_name, ' ', bm.last_name) as branch_manager
    FROM branch b
    LEFT JOIN branch_document_requirements bdr ON b.branch_id = bdr.branch_id
    LEFT JOIN business_manager bm ON b.business_manager_id = bm.business_manager_id
    GROUP BY b.branch_id, b.branch_name, b.area, bm.first_name, bm.last_name
    ORDER BY b.branch_name ASC;
END$$

-- ============================================================
-- 15. CHECK IF STALLHOLDER HAS COMPLETE DOCUMENTS
-- Returns whether a stallholder has submitted all required documents
-- ============================================================
DROP PROCEDURE IF EXISTS `checkStallholderDocumentCompletion`$$

CREATE DEFINER=`root`@`localhost` PROCEDURE `checkStallholderDocumentCompletion` (
    IN `p_stallholder_id` INT
)   
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_required_count INT DEFAULT 0;
    DECLARE v_submitted_count INT DEFAULT 0;
    DECLARE v_verified_count INT DEFAULT 0;
    
    -- Get stallholder's branch
    SELECT branch_id INTO v_branch_id
    FROM stallholder
    WHERE stallholder_id = p_stallholder_id;
    
    -- Count required documents for the branch
    SELECT COUNT(*) INTO v_required_count
    FROM branch_document_requirements
    WHERE branch_id = v_branch_id AND is_required = 1;
    
    -- Count submitted documents
    SELECT COUNT(*) INTO v_submitted_count
    FROM applicant_documents ad
    INNER JOIN stallholder sh ON ad.applicant_id = sh.applicant_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND ad.document_type_id IN (
          SELECT document_type_id 
          FROM branch_document_requirements 
          WHERE branch_id = v_branch_id AND is_required = 1
      );
    
    -- Count verified documents
    SELECT COUNT(*) INTO v_verified_count
    FROM applicant_documents ad
    INNER JOIN stallholder sh ON ad.applicant_id = sh.applicant_id
    WHERE sh.stallholder_id = p_stallholder_id
      AND ad.document_type_id IN (
          SELECT document_type_id 
          FROM branch_document_requirements 
          WHERE branch_id = v_branch_id AND is_required = 1
      )
      AND ad.verification_status = 'verified';
    
    SELECT 
        p_stallholder_id as stallholder_id,
        v_branch_id as branch_id,
        v_required_count as required_documents,
        v_submitted_count as submitted_documents,
        v_verified_count as verified_documents,
        CASE 
            WHEN v_verified_count = v_required_count THEN 'Complete'
            WHEN v_submitted_count = v_required_count THEN 'Pending Verification'
            ELSE 'Incomplete'
        END as status,
        CASE 
            WHEN v_verified_count = v_required_count THEN 1
            ELSE 0
        END as is_complete;
END$$

DELIMITER ;
