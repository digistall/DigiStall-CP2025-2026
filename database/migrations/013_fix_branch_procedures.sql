-- Migration: Fix Branch Stored Procedures
-- Version: 1.0.0
-- Description: 
--   1. Update deleteBranch to perform HARD DELETE instead of soft delete
--   2. Update createBranch to accept status parameter
-- Date: 2025-11-05

-- ============================================
-- 1. Fix deleteBranch - HARD DELETE
-- ============================================

DROP PROCEDURE IF EXISTS deleteBranch;

DELIMITER $$

CREATE PROCEDURE deleteBranch (IN p_branch_id INT)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Error: Failed to delete branch' AS error_message;
    END;
    
    START TRANSACTION;
    
    -- Delete related records first (foreign key constraints)
    
    -- Delete branch managers
    DELETE FROM branch_manager WHERE branch_id = p_branch_id;
    
    -- Delete floors and their sections
    DELETE s FROM section s
    INNER JOIN floor f ON s.floor_id = f.floor_id
    WHERE f.branch_id = p_branch_id;
    
    DELETE FROM floor WHERE branch_id = p_branch_id;
    
    -- Note: Stalls are deleted via CASCADE due to foreign key on section
    -- Applications, auctions, raffles will cascade from stalls
    
    -- Finally, delete the branch itself
    DELETE FROM branch WHERE branch_id = p_branch_id;
    
    COMMIT;
    
    SELECT ROW_COUNT() as affected_rows;
END$$

DELIMITER ;


-- ============================================
-- 2. Fix createBranch - Add status parameter
-- ============================================

DROP PROCEDURE IF EXISTS createBranch;

DELIMITER $$

CREATE PROCEDURE createBranch (
    IN p_admin_id INT,
    IN p_branch_name VARCHAR(100),
    IN p_area VARCHAR(100),
    IN p_location VARCHAR(255),
    IN p_address TEXT,
    IN p_contact_number VARCHAR(20),
    IN p_email VARCHAR(100),
    IN p_status ENUM('Active','Inactive','Under Construction','Maintenance')
)
BEGIN
    INSERT INTO branch (
        admin_id, 
        branch_name, 
        area, 
        location, 
        address, 
        contact_number, 
        email, 
        status
    )
    VALUES (
        p_admin_id, 
        p_branch_name, 
        p_area, 
        p_location, 
        p_address, 
        p_contact_number, 
        p_email, 
        COALESCE(p_status, 'Active')
    );
    
    SELECT LAST_INSERT_ID() as branch_id;
END$$

DELIMITER ;

-- ============================================
-- Record Migration
-- ============================================

INSERT INTO migrations (migration_name, version, executed_at)
VALUES ('013_fix_branch_procedures', '1.0.0', NOW());
