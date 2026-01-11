-- Migration: 436_sp_document_review_workbench.sql
-- Run each block separately in MySQL Workbench

-- SELECT THE DATABASE FIRST
USE `naga_stall`;

-- ============================================================
-- 1. GET DOCUMENTS BY STALLHOLDER ID
-- ============================================================
DROP PROCEDURE IF EXISTS `sp_getDocumentsByStallholderId`;

CREATE PROCEDURE `sp_getDocumentsByStallholderId` (
    IN `p_stallholder_id` INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.email as stallholder_email,
        sh.contact_number as stallholder_phone,
        st.stall_no,
        st.stall_location,
        sd.document_type_id,
        dt.document_name,
        dt.description as document_description,
        sd.file_path,
        sd.original_filename,
        sd.file_size,
        sd.upload_date,
        sd.verification_status as status,
        sd.verified_by as reviewed_by,
        sd.verified_at as reviewed_at,
        sd.rejection_reason,
        sd.expiry_date,
        sd.notes,
        CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
    FROM stallholder_documents sd
    INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id
    WHERE sd.stallholder_id = p_stallholder_id
    ORDER BY sd.upload_date DESC;
END;

-- ============================================================
-- 2. GET PENDING DOCUMENTS FOR BRANCH
-- ============================================================
DROP PROCEDURE IF EXISTS `sp_getPendingDocumentsForBranch`;

CREATE PROCEDURE `sp_getPendingDocumentsForBranch` (
    IN `p_branch_id` INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.email as stallholder_email,
        sh.contact_number as stallholder_phone,
        st.stall_no,
        st.stall_location,
        sd.document_type_id,
        dt.document_name,
        dt.description as document_description,
        sd.file_path,
        sd.original_filename,
        sd.file_size,
        sd.upload_date,
        sd.verification_status as status,
        sd.verified_by as reviewed_by,
        sd.verified_at as reviewed_at,
        sd.rejection_reason,
        sd.expiry_date,
        sd.notes,
        CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
    FROM stallholder_documents sd
    INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id
    WHERE sh.branch_id = p_branch_id
      AND sd.verification_status = 'pending'
    ORDER BY sd.upload_date DESC;
END;

-- ============================================================
-- 3. GET ALL DOCUMENTS FOR BRANCH
-- ============================================================
DROP PROCEDURE IF EXISTS `sp_getAllDocumentsForBranch`;

CREATE PROCEDURE `sp_getAllDocumentsForBranch` (
    IN `p_branch_id` INT,
    IN `p_status` VARCHAR(20),
    IN `p_limit` INT,
    IN `p_offset` INT
)
BEGIN
    IF p_status IS NULL OR p_status = '' OR p_status = 'all' THEN
        SELECT 
            sd.document_id,
            sd.stallholder_id,
            sh.stallholder_name,
            sh.business_name,
            st.stall_no,
            st.stall_location,
            sd.document_type_id,
            dt.document_name,
            sd.file_path,
            sd.original_filename,
            sd.file_size,
            sd.upload_date,
            sd.verification_status as status,
            sd.verified_by as reviewed_by,
            sd.verified_at as reviewed_at,
            sd.rejection_reason,
            CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
        FROM stallholder_documents sd
        INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id
        LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id
        WHERE sh.branch_id = p_branch_id
        ORDER BY sd.upload_date DESC
        LIMIT p_limit OFFSET p_offset;
    ELSE
        SELECT 
            sd.document_id,
            sd.stallholder_id,
            sh.stallholder_name,
            sh.business_name,
            st.stall_no,
            st.stall_location,
            sd.document_type_id,
            dt.document_name,
            sd.file_path,
            sd.original_filename,
            sd.file_size,
            sd.upload_date,
            sd.verification_status as status,
            sd.verified_by as reviewed_by,
            sd.verified_at as reviewed_at,
            sd.rejection_reason,
            CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
        FROM stallholder_documents sd
        INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id
        LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id
        WHERE sh.branch_id = p_branch_id
          AND sd.verification_status = p_status
        ORDER BY sd.upload_date DESC
        LIMIT p_limit OFFSET p_offset;
    END IF;
END;

-- ============================================================
-- 4. COUNT DOCUMENTS BY STATUS FOR BRANCH
-- ============================================================
DROP PROCEDURE IF EXISTS `sp_getDocumentCountsForBranch`;

CREATE PROCEDURE `sp_getDocumentCountsForBranch` (
    IN `p_branch_id` INT
)
BEGIN
    SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN sd.verification_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN sd.verification_status = 'verified' THEN 1 ELSE 0 END) as approved_count,
        SUM(CASE WHEN sd.verification_status = 'rejected' THEN 1 ELSE 0 END) as rejected_count,
        SUM(CASE WHEN sd.verification_status = 'expired' THEN 1 ELSE 0 END) as expired_count
    FROM stallholder_documents sd
    INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
    WHERE sh.branch_id = p_branch_id;
END;

-- ============================================================
-- 5. REVIEW/VERIFY DOCUMENT
-- ============================================================
DROP PROCEDURE IF EXISTS `sp_reviewStallholderDocument`;

CREATE PROCEDURE `sp_reviewStallholderDocument` (
    IN `p_document_id` INT,
    IN `p_status` VARCHAR(20),
    IN `p_rejection_reason` TEXT,
    IN `p_verified_by` INT
)
BEGIN
    DECLARE v_affected INT DEFAULT 0;
    DECLARE v_current_status VARCHAR(20);
    
    SELECT verification_status INTO v_current_status
    FROM stallholder_documents
    WHERE document_id = p_document_id;
    
    IF v_current_status IS NULL THEN
        SELECT 0 as success, 'Document not found' as message;
    ELSE
        UPDATE stallholder_documents
        SET 
            verification_status = p_status,
            rejection_reason = CASE WHEN p_status = 'rejected' THEN p_rejection_reason ELSE NULL END,
            verified_by = p_verified_by,
            verified_at = CURRENT_TIMESTAMP
        WHERE document_id = p_document_id;
        
        SET v_affected = ROW_COUNT();
        
        IF v_affected > 0 THEN
            SELECT 
                1 as success, 
                CONCAT('Document ', p_status, ' successfully') as message,
                p_document_id as document_id,
                p_status as new_status;
        ELSE
            SELECT 0 as success, 'Failed to update document' as message;
        END IF;
    END IF;
END;

-- ============================================================
-- 6. GET DOCUMENT BY ID
-- ============================================================
DROP PROCEDURE IF EXISTS `sp_getDocumentById`;

CREATE PROCEDURE `sp_getDocumentById` (
    IN `p_document_id` INT
)
BEGIN
    SELECT 
        sd.document_id,
        sd.stallholder_id,
        sh.stallholder_name,
        sh.business_name,
        sh.email as stallholder_email,
        sh.contact_number as stallholder_phone,
        sh.address as stallholder_address,
        sh.branch_id,
        b.branch_name,
        st.stall_no,
        st.stall_location,
        sd.document_type_id,
        dt.document_name,
        dt.description as document_description,
        sd.file_path,
        sd.original_filename,
        sd.file_size,
        sd.upload_date,
        sd.verification_status as status,
        sd.verified_by as reviewed_by,
        sd.verified_at as reviewed_at,
        sd.rejection_reason,
        sd.expiry_date,
        sd.notes,
        CONCAT(bm.first_name, ' ', bm.last_name) as reviewed_by_name
    FROM stallholder_documents sd
    INNER JOIN stallholder sh ON sd.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    INNER JOIN branch b ON sh.branch_id = b.branch_id
    INNER JOIN document_types dt ON sd.document_type_id = dt.document_type_id
    LEFT JOIN business_manager bm ON sd.verified_by = bm.business_manager_id
    WHERE sd.document_id = p_document_id;
END;
