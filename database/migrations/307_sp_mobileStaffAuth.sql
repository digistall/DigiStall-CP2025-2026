-- Migration 307: Mobile Staff Authentication Stored Procedures
-- This creates stored procedures for inspector and collector login/logout in the mobile app

DELIMITER //

-- =====================================================
-- SP: sp_getInspectorByUsername
-- Purpose: Get inspector details for login authentication
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getInspectorByUsername//
CREATE PROCEDURE sp_getInspectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        i.inspector_id as staff_id,
        i.username,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.status,
        i.password as password_hash,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (i.username = p_username OR i.email = p_username)
      AND i.status = 'active'
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getCollectorByUsername
-- Purpose: Get collector details for login authentication
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getCollectorByUsername//
CREATE PROCEDURE sp_getCollectorByUsername(
    IN p_username VARCHAR(255)
)
BEGIN
    SELECT 
        c.collector_id as staff_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.status,
        c.password_hash,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (c.username = p_username OR c.email = p_username)
      AND c.status = 'active'
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_updateInspectorLastLogin
-- Purpose: Update inspector's last_login timestamp
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogin//
CREATE PROCEDURE sp_updateInspectorLastLogin(
    IN p_inspector_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE inspector 
    SET last_login = p_login_time 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_updateCollectorLastLogin
-- Purpose: Update collector's last_login timestamp
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogin//
CREATE PROCEDURE sp_updateCollectorLastLogin(
    IN p_collector_id INT,
    IN p_login_time DATETIME
)
BEGIN
    UPDATE collector 
    SET last_login = p_login_time 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_updateInspectorLastLogout
-- Purpose: Update inspector's last_logout timestamp
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateInspectorLastLogout//
CREATE PROCEDURE sp_updateInspectorLastLogout(
    IN p_inspector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE inspector 
    SET last_logout = p_logout_time 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_updateCollectorLastLogout
-- Purpose: Update collector's last_logout timestamp
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateCollectorLastLogout//
CREATE PROCEDURE sp_updateCollectorLastLogout(
    IN p_collector_id INT,
    IN p_logout_time DATETIME
)
BEGIN
    UPDATE collector 
    SET last_logout = p_logout_time 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_getInspectorNameById
-- Purpose: Get inspector name for activity logging
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getInspectorNameById//
CREATE PROCEDURE sp_getInspectorNameById(
    IN p_inspector_id INT
)
BEGIN
    SELECT first_name, last_name 
    FROM inspector 
    WHERE inspector_id = p_inspector_id;
END//

-- =====================================================
-- SP: sp_getCollectorNameById
-- Purpose: Get collector name for activity logging
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getCollectorNameById//
CREATE PROCEDURE sp_getCollectorNameById(
    IN p_collector_id INT
)
BEGIN
    SELECT first_name, last_name 
    FROM collector 
    WHERE collector_id = p_collector_id;
END//

-- =====================================================
-- SP: sp_logStaffActivity
-- Purpose: Log staff activity for audit trail
-- =====================================================
DROP PROCEDURE IF EXISTS sp_logStaffActivity//
CREATE PROCEDURE sp_logStaffActivity(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_action_type VARCHAR(50),
    IN p_action_description TEXT,
    IN p_module VARCHAR(100),
    IN p_ip_address VARCHAR(45),
    IN p_user_agent TEXT,
    IN p_status VARCHAR(50),
    IN p_created_at DATETIME
)
BEGIN
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, status, created_at)
    VALUES (
        p_staff_type,
        p_staff_id,
        p_staff_name,
        p_branch_id,
        p_action_type,
        p_action_description,
        p_module,
        p_ip_address,
        p_user_agent,
        p_status,
        p_created_at
    );
    
    SELECT LAST_INSERT_ID() as log_id;
END//

DELIMITER ;

-- Success message
SELECT 'Mobile Staff Authentication stored procedures created successfully' as status;
