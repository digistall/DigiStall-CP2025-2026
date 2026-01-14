-- Migration 309: Employee Controller Stored Procedures
-- This creates stored procedures for all employee operations

DELIMITER //

-- =====================================================
-- SP: sp_getAllEmployeesAll
-- Purpose: Get all business employees (for system admin)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllEmployeesAll//
CREATE PROCEDURE sp_getAllEmployeesAll(
    IN p_status VARCHAR(50)
)
BEGIN
    SELECT 
        be.*, 
        b.branch_name, 
        bm.first_name as manager_first_name, 
        bm.last_name as manager_last_name 
    FROM business_employee be 
    LEFT JOIN branch b ON be.branch_id = b.branch_id 
    LEFT JOIN business_manager bm ON be.created_by_manager = bm.business_manager_id 
    WHERE be.status = p_status 
    ORDER BY be.created_at DESC;
END//

-- =====================================================
-- SP: sp_getAllEmployeesByBranches
-- Purpose: Get business employees filtered by branch IDs
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllEmployeesByBranches//
CREATE PROCEDURE sp_getAllEmployeesByBranches(
    IN p_branch_ids VARCHAR(500),
    IN p_status VARCHAR(50)
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            be.*, 
            b.branch_name, 
            bm.first_name as manager_first_name, 
            bm.last_name as manager_last_name 
        FROM business_employee be 
        LEFT JOIN branch b ON be.branch_id = b.branch_id 
        LEFT JOIN business_manager bm ON be.created_by_manager = bm.business_manager_id 
        WHERE be.status = ''', p_status, '''
        AND be.branch_id IN (', p_branch_ids, ')
        ORDER BY be.created_at DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_getEmployeeByIdWithBranch
-- Purpose: Get employee by ID with branch info
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getEmployeeByIdWithBranch//
CREATE PROCEDURE sp_getEmployeeByIdWithBranch(
    IN p_employee_id INT
)
BEGIN
    SELECT business_employee_id, branch_id 
    FROM business_employee 
    WHERE business_employee_id = p_employee_id;
END//

-- =====================================================
-- SP: sp_getActiveSessionsAll
-- Purpose: Get all active employee sessions (for system admin)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getActiveSessionsAll//
CREATE PROCEDURE sp_getActiveSessionsAll()
BEGIN
    SELECT 
        es.session_id,
        es.business_employee_id,
        es.is_active,
        es.login_time,
        es.last_activity,
        es.logout_time,
        be.first_name,
        be.last_name,
        be.branch_id
    FROM employee_session es
    INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
    WHERE es.is_active = true 
       OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE)
    ORDER BY es.last_activity DESC;
END//

-- =====================================================
-- SP: sp_getActiveSessionsByBranches
-- Purpose: Get active employee sessions filtered by branches
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getActiveSessionsByBranches//
CREATE PROCEDURE sp_getActiveSessionsByBranches(
    IN p_branch_ids VARCHAR(500)
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            es.session_id,
            es.business_employee_id,
            es.is_active,
            es.login_time,
            es.last_activity,
            es.logout_time,
            be.first_name,
            be.last_name,
            be.branch_id
        FROM employee_session es
        INNER JOIN business_employee be ON es.business_employee_id = be.business_employee_id
        WHERE be.branch_id IN (', p_branch_ids, ')
        AND (es.is_active = true OR es.last_activity >= DATE_SUB(NOW(), INTERVAL 30 MINUTE))
        ORDER BY es.last_activity DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_deactivateEmployeeSessions
-- Purpose: Deactivate all active sessions for an employee
-- =====================================================
DROP PROCEDURE IF EXISTS sp_deactivateEmployeeSessions//
CREATE PROCEDURE sp_deactivateEmployeeSessions(
    IN p_employee_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE employee_session 
    SET is_active = 0, logout_time = p_logout_time 
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_terminateEmployee
-- Purpose: Terminate/deactivate an employee with reason
-- =====================================================
DROP PROCEDURE IF EXISTS sp_terminateEmployee//
CREATE PROCEDURE sp_terminateEmployee(
    IN p_employee_id INT,
    IN p_reason VARCHAR(500)
)
BEGIN
    UPDATE business_employee 
    SET status = 'inactive', 
        termination_date = CURDATE(),
        termination_reason = p_reason
    WHERE business_employee_id = p_employee_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_logoutEmployee
-- Purpose: Logout employee - update last_logout and deactivate sessions
-- =====================================================
DROP PROCEDURE IF EXISTS sp_logoutEmployee//
CREATE PROCEDURE sp_logoutEmployee(
    IN p_employee_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    -- Update employee's last_logout and is_active status
    UPDATE business_employee 
    SET last_logout = p_logout_time, is_active = 0 
    WHERE business_employee_id = p_employee_id;
    
    -- Deactivate all active sessions
    UPDATE employee_session 
    SET is_active = 0, logout_time = p_logout_time 
    WHERE business_employee_id = p_employee_id AND is_active = 1;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

-- Success message
SELECT 'Employee Controller stored procedures created successfully' as status;
