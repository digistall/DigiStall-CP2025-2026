-- Migration 314: Unified Auth Controller Stored Procedures
-- This creates stored procedures for unified authentication

DELIMITER //

-- =====================================================
-- SP: sp_getSystemAdminByUsername
-- Purpose: Get system administrator by username for login
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getSystemAdminByUsername//
CREATE PROCEDURE sp_getSystemAdminByUsername(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT * FROM system_administrator 
    WHERE username = p_username AND status = 'Active';
END//

-- =====================================================
-- SP: sp_getBusinessOwnerByUsername
-- Purpose: Get business owner by username for login
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerByUsername//
CREATE PROCEDURE sp_getBusinessOwnerByUsername(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT * FROM stall_business_owner 
    WHERE owner_username = p_username AND status = 'Active';
END//

-- =====================================================
-- SP: sp_getBusinessManagerByUsername
-- Purpose: Get business manager by username for login
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessManagerByUsername//
CREATE PROCEDURE sp_getBusinessManagerByUsername(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT * FROM business_manager 
    WHERE manager_username = p_username AND status = 'Active';
END//

-- =====================================================
-- SP: sp_getBusinessEmployeeByUsername
-- Purpose: Get business employee by username for login
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeeByUsername//
CREATE PROCEDURE sp_getBusinessEmployeeByUsername(
    IN p_username VARCHAR(100)
)
BEGIN
    SELECT * FROM business_employee 
    WHERE employee_username = p_username AND status = 'Active';
END//

-- =====================================================
-- SP: sp_getBranchById
-- Purpose: Get branch info by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchById//
CREATE PROCEDURE sp_getBranchById(
    IN p_branch_id INT
)
BEGIN
    SELECT branch_id, branch_name 
    FROM branch 
    WHERE branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_updateSystemAdminLastLogin
-- Purpose: Update last_login for system admin
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLoginNow//
CREATE PROCEDURE sp_updateSystemAdminLastLoginNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE system_administrator 
    SET last_login = NOW() 
    WHERE system_admin_id = p_id;
END//

-- =====================================================
-- SP: sp_updateBusinessOwnerLastLogin
-- Purpose: Update last_login for business owner
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateBusinessOwnerLastLoginNow//
CREATE PROCEDURE sp_updateBusinessOwnerLastLoginNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE stall_business_owner 
    SET last_login = NOW() 
    WHERE business_owner_id = p_id;
END//

-- =====================================================
-- SP: sp_updateBusinessManagerLastLoginNow
-- Purpose: Update last_login for business manager
-- Note: Handles case where last_login column may not exist
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateBusinessManagerLastLoginNow//
CREATE PROCEDURE sp_updateBusinessManagerLastLoginNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_manager 
    SET last_login = NOW() 
    WHERE business_manager_id = p_id;
END//

-- =====================================================
-- SP: sp_updateBusinessEmployeeLastLoginNow
-- Purpose: Update last_login for business employee
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLoginNow//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLoginNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_employee 
    SET last_login = NOW() 
    WHERE business_employee_id = p_id;
END//

-- =====================================================
-- SP: sp_logStaffActivityLogin
-- Purpose: Log login activity
-- =====================================================
DROP PROCEDURE IF EXISTS sp_logStaffActivityLogin//
CREATE PROCEDURE sp_logStaffActivityLogin(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_action_description TEXT,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, action_type, action_description, module, ip_address, user_agent, status, created_at) 
    VALUES (
        p_staff_type, p_staff_id, p_staff_name, 'LOGIN', p_action_description, 
        'authentication', p_ip_address, p_user_agent, 'success', NOW()
    );
END//

-- =====================================================
-- SP: sp_logStaffActivityLogout
-- Purpose: Log logout activity
-- =====================================================
DROP PROCEDURE IF EXISTS sp_logStaffActivityLogout//
CREATE PROCEDURE sp_logStaffActivityLogout(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_action_description TEXT,
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, action_type, action_description, module, ip_address, user_agent, status, created_at) 
    VALUES (
        p_staff_type, p_staff_id, p_staff_name, 'LOGOUT', p_action_description, 
        'authentication', p_ip_address, p_user_agent, 'success', NOW()
    );
END//

-- =====================================================
-- SP: sp_updateLastLogoutNow (for all types)
-- Purpose: Update last_logout with NOW()
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLogoutNow//
CREATE PROCEDURE sp_updateSystemAdminLastLogoutNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE system_administrator 
    SET last_logout = NOW() 
    WHERE system_admin_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_updateBusinessOwnerLastLogoutNow//
CREATE PROCEDURE sp_updateBusinessOwnerLastLogoutNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE stall_business_owner 
    SET last_logout = NOW() 
    WHERE business_owner_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_updateBusinessManagerLastLogoutNow//
CREATE PROCEDURE sp_updateBusinessManagerLastLogoutNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_manager 
    SET last_logout = NOW() 
    WHERE business_manager_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLogoutNow//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLogoutNow(
    IN p_id INT
)
BEGIN
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION BEGIN END;
    UPDATE business_employee 
    SET last_logout = NOW() 
    WHERE business_employee_id = p_id;
END//

-- =====================================================
-- SP: sp_getSystemAdminById
-- Purpose: Get system admin by ID for getCurrentUser
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getSystemAdminById//
CREATE PROCEDURE sp_getSystemAdminById(
    IN p_id INT
)
BEGIN
    SELECT * FROM system_administrator WHERE system_admin_id = p_id;
END//

-- =====================================================
-- SP: sp_getBusinessOwnerById
-- Purpose: Get business owner by ID for getCurrentUser
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessOwnerById//
CREATE PROCEDURE sp_getBusinessOwnerById(
    IN p_id INT
)
BEGIN
    SELECT * FROM stall_business_owner WHERE business_owner_id = p_id;
END//

-- =====================================================
-- SP: sp_getBusinessManagerWithBranch
-- Purpose: Get business manager with branch info
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessManagerWithBranch//
CREATE PROCEDURE sp_getBusinessManagerWithBranch(
    IN p_id INT
)
BEGIN
    SELECT u.*, b.branch_name 
    FROM business_manager u
    LEFT JOIN branch b ON u.branch_id = b.branch_id
    WHERE u.business_manager_id = p_id;
END//

-- =====================================================
-- SP: sp_getBusinessEmployeeWithBranch
-- Purpose: Get business employee with branch info
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeeWithBranch//
CREATE PROCEDURE sp_getBusinessEmployeeWithBranch(
    IN p_id INT
)
BEGIN
    SELECT u.*, b.branch_name 
    FROM business_employee u
    LEFT JOIN branch b ON u.branch_id = b.branch_id
    WHERE u.business_employee_id = p_id;
END//

DELIMITER ;

-- Success message
SELECT 'Unified Auth Controller stored procedures created successfully' as status;
