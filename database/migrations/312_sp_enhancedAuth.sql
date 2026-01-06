-- Migration 312: Enhanced Auth Controller Stored Procedures
-- This creates stored procedures for enhanced authentication

DELIMITER //

-- =====================================================
-- SP: sp_getUserByEmailForLogin
-- Purpose: Get user by email for login (generic across tables)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeeByEmail//
CREATE PROCEDURE sp_getBusinessEmployeeByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM business_employee 
    WHERE email = p_email AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getBusinessManagerByEmailForLogin//
CREATE PROCEDURE sp_getBusinessManagerByEmailForLogin(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM business_manager 
    WHERE manager_email = p_email AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getBusinessOwnerByEmail//
CREATE PROCEDURE sp_getBusinessOwnerByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM stall_business_owner 
    WHERE email = p_email AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getSystemAdminByEmail//
CREATE PROCEDURE sp_getSystemAdminByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM system_administrator 
    WHERE email = p_email AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getInspectorByEmail//
CREATE PROCEDURE sp_getInspectorByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM inspector 
    WHERE email = p_email AND status = 'active';
END//

DROP PROCEDURE IF EXISTS sp_getCollectorByEmail//
CREATE PROCEDURE sp_getCollectorByEmail(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT * FROM collector 
    WHERE email = p_email AND status = 'active';
END//

-- =====================================================
-- SP: sp_getBranchDetails
-- Purpose: Get branch details by ID
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBranchDetails//
CREATE PROCEDURE sp_getBranchDetails(
    IN p_branch_id INT
)
BEGIN
    SELECT branch_id, branch_name, area, location 
    FROM branch 
    WHERE branch_id = p_branch_id;
END//

-- =====================================================
-- SP: sp_getRefreshToken
-- Purpose: Get refresh token for validation
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getRefreshToken//
CREATE PROCEDURE sp_getRefreshToken(
    IN p_token VARCHAR(500)
)
BEGIN
    SELECT * FROM refresh_tokens 
    WHERE refresh_token = p_token 
    AND expires_at > NOW() 
    AND revoked = FALSE;
END//

-- =====================================================
-- SP: sp_getRefreshTokenInfo
-- Purpose: Get minimal refresh token info for logout
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getRefreshTokenInfo//
CREATE PROCEDURE sp_getRefreshTokenInfo(
    IN p_token VARCHAR(500)
)
BEGIN
    SELECT token_id, user_id, user_type 
    FROM refresh_tokens 
    WHERE refresh_token = p_token;
END//

-- =====================================================
-- SP: sp_getUserById (for each user type)
-- Purpose: Get user by ID for token refresh
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getBusinessEmployeeById//
CREATE PROCEDURE sp_getBusinessEmployeeById(
    IN p_id INT
)
BEGIN
    SELECT * FROM business_employee 
    WHERE business_employee_id = p_id AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getBusinessManagerById//
CREATE PROCEDURE sp_getBusinessManagerById(
    IN p_id INT
)
BEGIN
    SELECT * FROM business_manager 
    WHERE business_manager_id = p_id AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getBusinessOwnerById//
CREATE PROCEDURE sp_getBusinessOwnerById(
    IN p_id INT
)
BEGIN
    SELECT * FROM stall_business_owner 
    WHERE business_owner_id = p_id AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getSystemAdminById//
CREATE PROCEDURE sp_getSystemAdminById(
    IN p_id INT
)
BEGIN
    SELECT * FROM system_administrator 
    WHERE system_admin_id = p_id AND status = 'Active';
END//

DROP PROCEDURE IF EXISTS sp_getInspectorById//
CREATE PROCEDURE sp_getInspectorById(
    IN p_id INT
)
BEGIN
    SELECT * FROM inspector 
    WHERE inspector_id = p_id AND status = 'active';
END//

DROP PROCEDURE IF EXISTS sp_getCollectorById//
CREATE PROCEDURE sp_getCollectorById(
    IN p_id INT
)
BEGIN
    SELECT * FROM collector 
    WHERE collector_id = p_id AND status = 'active';
END//

-- =====================================================
-- SP: sp_checkUserExists
-- Purpose: Check if user exists by ID in their table
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkUserExists//
CREATE PROCEDURE sp_checkUserExists(
    IN p_table_name VARCHAR(100),
    IN p_id_column VARCHAR(100),
    IN p_id INT
)
BEGIN
    SET @sql = CONCAT('SELECT ', p_id_column, ' FROM ', p_table_name, ' WHERE ', p_id_column, ' = ?');
    PREPARE stmt FROM @sql;
    SET @id = p_id;
    EXECUTE stmt USING @id;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_updateLastLogin
-- Purpose: Update last_login for any user type
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLogin//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLogin(
    IN p_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE business_employee 
    SET last_login = p_login_time 
    WHERE business_employee_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DROP PROCEDURE IF EXISTS sp_updateBusinessManagerLastLogin//
CREATE PROCEDURE sp_updateBusinessManagerLastLogin(
    IN p_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE business_manager 
    SET last_login = p_login_time 
    WHERE business_manager_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DROP PROCEDURE IF EXISTS sp_updateBusinessOwnerLastLogin//
CREATE PROCEDURE sp_updateBusinessOwnerLastLogin(
    IN p_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE stall_business_owner 
    SET last_login = p_login_time 
    WHERE business_owner_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLogin//
CREATE PROCEDURE sp_updateSystemAdminLastLogin(
    IN p_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE system_administrator 
    SET last_login = p_login_time 
    WHERE system_admin_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_revokeRefreshToken
-- Purpose: Revoke a refresh token on logout
-- =====================================================
DROP PROCEDURE IF EXISTS sp_revokeRefreshToken//
CREATE PROCEDURE sp_revokeRefreshToken(
    IN p_token_id INT
)
BEGIN
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW() 
    WHERE token_id = p_token_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_revokeAllUserTokens
-- Purpose: Revoke all refresh tokens for a user
-- =====================================================
DROP PROCEDURE IF EXISTS sp_revokeAllUserTokens//
CREATE PROCEDURE sp_revokeAllUserTokens(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50)
)
BEGIN
    UPDATE refresh_tokens 
    SET revoked = TRUE, revoked_at = NOW() 
    WHERE user_id = p_user_id 
    AND user_type = p_user_type 
    AND revoked = FALSE;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_storeRefreshToken
-- Purpose: Store new refresh token
-- =====================================================
DROP PROCEDURE IF EXISTS sp_storeRefreshToken//
CREATE PROCEDURE sp_storeRefreshToken(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_refresh_token VARCHAR(500),
    IN p_access_token_jti VARCHAR(255),
    IN p_device_fingerprint VARCHAR(255),
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT,
    IN p_expires_at DATETIME
)
BEGIN
    INSERT INTO refresh_tokens 
    (user_id, user_type, refresh_token, access_token_jti, device_fingerprint, ip_address, user_agent, expires_at)
    VALUES (p_user_id, p_user_type, p_refresh_token, p_access_token_jti, p_device_fingerprint, p_ip_address, p_user_agent, p_expires_at);
    
    SELECT LAST_INSERT_ID() as token_id;
END//

-- =====================================================
-- SP: sp_logTokenActivity
-- Purpose: Log token activity
-- =====================================================
DROP PROCEDURE IF EXISTS sp_logTokenActivity//
CREATE PROCEDURE sp_logTokenActivity(
    IN p_token_id INT,
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_activity_type VARCHAR(50),
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT,
    IN p_success BOOLEAN
)
BEGIN
    INSERT INTO token_activity_log 
    (token_id, user_id, user_type, activity_type, ip_address, user_agent, success)
    VALUES (p_token_id, p_user_id, p_user_type, p_activity_type, p_ip_address, p_user_agent, p_success);
END//

-- =====================================================
-- SP: sp_getActiveRefreshToken
-- Purpose: Get active refresh token for validation
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getActiveRefreshToken//
CREATE PROCEDURE sp_getActiveRefreshToken(
    IN p_token VARCHAR(500)
)
BEGIN
    SELECT * FROM refresh_tokens 
    WHERE refresh_token = p_token 
    AND is_active = TRUE 
    AND expires_at > NOW();
END//

-- =====================================================
-- SP: sp_updateRefreshTokenLastUsed
-- Purpose: Update last used time for refresh token
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateRefreshTokenLastUsed//
CREATE PROCEDURE sp_updateRefreshTokenLastUsed(
    IN p_token_id INT
)
BEGIN
    UPDATE refresh_tokens 
    SET last_used_at = NOW() 
    WHERE token_id = p_token_id;
END//

-- =====================================================
-- SP: sp_updateLastLogoutByType
-- Purpose: Update last logout for any user type
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateBusinessEmployeeLastLogout//
CREATE PROCEDURE sp_updateBusinessEmployeeLastLogout(
    IN p_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE business_employee 
    SET last_logout = p_logout_time 
    WHERE business_employee_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DROP PROCEDURE IF EXISTS sp_updateBusinessManagerLastLogout//
CREATE PROCEDURE sp_updateBusinessManagerLastLogout(
    IN p_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE business_manager 
    SET last_logout = p_logout_time 
    WHERE business_manager_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DROP PROCEDURE IF EXISTS sp_updateBusinessOwnerLastLogout//
CREATE PROCEDURE sp_updateBusinessOwnerLastLogout(
    IN p_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE stall_business_owner 
    SET last_logout = p_logout_time 
    WHERE business_owner_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DROP PROCEDURE IF EXISTS sp_updateSystemAdminLastLogout//
CREATE PROCEDURE sp_updateSystemAdminLastLogout(
    IN p_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE system_administrator 
    SET last_logout = p_logout_time 
    WHERE system_admin_id = p_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- Heartbeat Stored Procedures
-- Purpose: Update last_login for heartbeat functionality
-- =====================================================
DROP PROCEDURE IF EXISTS sp_heartbeatBusinessEmployee//
CREATE PROCEDURE sp_heartbeatBusinessEmployee(
    IN p_id INT,
    IN p_time DATETIME
)
BEGIN
    UPDATE business_employee SET last_login = p_time WHERE business_employee_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_heartbeatBusinessManager//
CREATE PROCEDURE sp_heartbeatBusinessManager(
    IN p_id INT,
    IN p_time DATETIME
)
BEGIN
    UPDATE business_manager SET last_login = p_time WHERE business_manager_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_heartbeatBusinessOwner//
CREATE PROCEDURE sp_heartbeatBusinessOwner(
    IN p_id INT,
    IN p_time DATETIME
)
BEGIN
    UPDATE stall_business_owner SET last_login = p_time WHERE business_owner_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_heartbeatSystemAdmin//
CREATE PROCEDURE sp_heartbeatSystemAdmin(
    IN p_id INT,
    IN p_time DATETIME
)
BEGIN
    UPDATE system_administrator SET last_login = p_time WHERE system_admin_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_heartbeatInspector//
CREATE PROCEDURE sp_heartbeatInspector(
    IN p_id INT,
    IN p_time DATETIME
)
BEGIN
    UPDATE inspector SET last_login = p_time WHERE inspector_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_heartbeatCollector//
CREATE PROCEDURE sp_heartbeatCollector(
    IN p_id INT,
    IN p_time DATETIME
)
BEGIN
    UPDATE collector SET last_login = p_time WHERE collector_id = p_id;
END//

-- =====================================================
-- SP: revokeAllUserTokens (different name format for compatibility)
-- Purpose: Revoke all tokens with revoke reason
-- =====================================================
DROP PROCEDURE IF EXISTS revokeAllUserTokens//
CREATE PROCEDURE revokeAllUserTokens(
    IN p_user_id INT,
    IN p_user_type VARCHAR(50),
    IN p_revoke_reason VARCHAR(100)
)
BEGIN
    UPDATE refresh_tokens 
    SET is_active = FALSE, 
        revoked_at = NOW(), 
        revoke_reason = p_revoke_reason
    WHERE user_id = p_user_id 
    AND user_type = p_user_type 
    AND is_active = TRUE;
END//

-- =====================================================
-- SP: sp_checkBusinessEmployeeExists
-- Purpose: Check if business employee exists
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkBusinessEmployeeExists//
CREATE PROCEDURE sp_checkBusinessEmployeeExists(
    IN p_id INT
)
BEGIN
    SELECT business_employee_id FROM business_employee WHERE business_employee_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_checkBusinessManagerExists//
CREATE PROCEDURE sp_checkBusinessManagerExists(
    IN p_id INT
)
BEGIN
    SELECT business_manager_id FROM business_manager WHERE business_manager_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_checkBusinessOwnerExists//
CREATE PROCEDURE sp_checkBusinessOwnerExists(
    IN p_id INT
)
BEGIN
    SELECT business_owner_id FROM stall_business_owner WHERE business_owner_id = p_id;
END//

DROP PROCEDURE IF EXISTS sp_checkSystemAdminExists//
CREATE PROCEDURE sp_checkSystemAdminExists(
    IN p_id INT
)
BEGIN
    SELECT system_admin_id FROM system_administrator WHERE system_admin_id = p_id;
END//

-- =====================================================
-- SP: sp_revokeRefreshTokenByHash
-- Purpose: Revoke refresh token by hash value
-- =====================================================
DROP PROCEDURE IF EXISTS sp_revokeRefreshTokenByHash//
CREATE PROCEDURE sp_revokeRefreshTokenByHash(
    IN p_hashed_token VARCHAR(500),
    IN p_reason VARCHAR(100)
)
BEGIN
    UPDATE refresh_tokens 
    SET is_active = FALSE, 
        revoked_at = NOW(), 
        revoke_reason = p_reason
    WHERE refresh_token = p_hashed_token;
END//

-- =====================================================
-- SP: sp_getRefreshTokenByHash
-- Purpose: Get token info by hash
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getRefreshTokenByHash//
CREATE PROCEDURE sp_getRefreshTokenByHash(
    IN p_hashed_token VARCHAR(500)
)
BEGIN
    SELECT token_id, user_id, user_type 
    FROM refresh_tokens 
    WHERE refresh_token = p_hashed_token;
END//

DELIMITER ;

-- Success message
SELECT 'Enhanced Auth Controller stored procedures created successfully' as status;
