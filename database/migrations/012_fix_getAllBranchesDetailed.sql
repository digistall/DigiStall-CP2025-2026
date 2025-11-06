-- =====================================================
-- Fix getAllBranchesDetailed Stored Procedure
-- Migration: 012_fix_getAllBranchesDetailed
-- Generated: November 5, 2025
-- =====================================================

DELIMITER $$

-- Drop and recreate getAllBranchesDetailed with manager information
DROP PROCEDURE IF EXISTS `getAllBranchesDetailed`$$

CREATE PROCEDURE `getAllBranchesDetailed`()
BEGIN
    SELECT 
        b.branch_id,
        b.admin_id,
        b.branch_name,
        b.area,
        b.location,
        b.address,
        b.contact_number,
        b.email,
        b.status,
        b.created_at,
        b.updated_at,
        bm.branch_manager_id as manager_id,
        bm.manager_username,
        CONCAT(bm.first_name, ' ', bm.last_name) as manager_name,
        CASE 
            WHEN bm.branch_manager_id IS NOT NULL THEN TRUE 
            ELSE FALSE 
        END as manager_assigned,
        bm.email as manager_email,
        bm.contact_number as manager_contact,
        bm.status as manager_status
    FROM branch b
    LEFT JOIN branch_manager bm ON b.branch_id = bm.branch_id AND bm.status = 'Active'
    ORDER BY b.branch_name;
END$$

DELIMITER ;

-- =====================================================
-- Register Migration
-- =====================================================
INSERT INTO migrations (migration_name, version) 
VALUES ('012_fix_getAllBranchesDetailed', '1.0.0')
ON DUPLICATE KEY UPDATE executed_at = CURRENT_TIMESTAMP;

-- =====================================================
-- Verification Query
-- =====================================================
SELECT CONCAT(
    '✅ Migration 012_fix_getAllBranchesDetailed completed successfully at ',
    NOW()
) as message;

-- Test the procedure
CALL getAllBranchesDetailed();
