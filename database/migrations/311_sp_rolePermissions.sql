-- Migration 311: Role Permissions and Branch Filter Stored Procedures
-- This creates stored procedures for role-based access control

DELIMITER //

-- =====================================================
-- SP: sp_getBranchIdForManager
-- Purpose: Get branch ID for a business manager
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchIdForManager//
CREATE PROCEDURE sp_getBranchIdForManager(
    IN p_manager_id INT
)
BEGIN
    SELECT branch_id 
    FROM business_manager 
    WHERE business_manager_id = p_manager_id;
END//

-- =====================================================
-- SP: sp_getBranchIdForEmployee
-- Purpose: Get branch ID for a business employee
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchIdForEmployee//
CREATE PROCEDURE sp_getBranchIdForEmployee(
    IN p_employee_id INT
)
BEGIN
    SELECT branch_id 
    FROM business_employee 
    WHERE business_employee_id = p_employee_id;
END//

-- =====================================================
-- SP: sp_getBranchIdsForOwner
-- Purpose: Get all branch IDs for a business owner (through managers)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchIdsForOwner//
CREATE PROCEDURE sp_getBranchIdsForOwner(
    IN p_owner_id INT
)
BEGIN
    SELECT DISTINCT bm.branch_id
    FROM business_manager bm
    WHERE bm.owner_id = p_owner_id
    AND bm.status = 'Active';
END//

DELIMITER ;

-- Success message
SELECT 'Role Permissions stored procedures created successfully' as status;
