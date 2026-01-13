-- Migration 310: Mobile Staff Controller Stored Procedures
-- This creates stored procedures for inspector and collector management

DELIMITER //

-- =====================================================
-- SP: sp_checkInspectorEmailExists
-- Purpose: Check if inspector email already exists
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkInspectorEmailExists//
CREATE PROCEDURE sp_checkInspectorEmailExists(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT inspector_id FROM inspector WHERE email = p_email;
END//

-- =====================================================
-- SP: sp_checkCollectorEmailExists
-- Purpose: Check if collector email already exists
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkCollectorEmailExists//
CREATE PROCEDURE sp_checkCollectorEmailExists(
    IN p_email VARCHAR(255)
)
BEGIN
    SELECT collector_id FROM collector WHERE email = p_email;
END//

-- =====================================================
-- SP: sp_checkCollectorTableExists
-- Purpose: Check if collector table exists in database
-- =====================================================
DROP PROCEDURE IF EXISTS sp_checkCollectorTableExists//
CREATE PROCEDURE sp_checkCollectorTableExists()
BEGIN
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'collector';
END//

-- =====================================================
-- SP: sp_getInspectorBranchAssignment
-- Purpose: Get inspector's assigned branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getInspectorBranchAssignment//
CREATE PROCEDURE sp_getInspectorBranchAssignment(
    IN p_inspector_id INT
)
BEGIN
    SELECT branch_id 
    FROM inspector_assignment 
    WHERE inspector_id = p_inspector_id 
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getCollectorBranchAssignment
-- Purpose: Get collector's assigned branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getCollectorBranchAssignment//
CREATE PROCEDURE sp_getCollectorBranchAssignment(
    IN p_collector_id INT
)
BEGIN
    SELECT branch_id 
    FROM collector_assignment 
    WHERE collector_id = p_collector_id 
    LIMIT 1;
END//

-- =====================================================
-- SP: sp_getAllInspectorsWithBranch
-- Purpose: Get all inspectors with their branch information
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllInspectorsWithBranch//
CREATE PROCEDURE sp_getAllInspectorsWithBranch()
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.status,
        i.last_login,
        i.last_logout,
        i.created_at,
        ia.branch_id,
        ia.status as assignment_status,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    ORDER BY i.created_at DESC;
END//

-- =====================================================
-- SP: sp_getAllCollectorsWithBranch
-- Purpose: Get all collectors with their branch information
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllCollectorsWithBranch//
CREATE PROCEDURE sp_getAllCollectorsWithBranch()
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.status,
        c.last_login,
        c.last_logout,
        c.created_at,
        ca.branch_id,
        ca.status as assignment_status,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    ORDER BY c.created_at DESC;
END//

-- =====================================================
-- SP: sp_getAllInspectorsByBranches
-- Purpose: Get inspectors filtered by branch IDs
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllInspectorsByBranches//
CREATE PROCEDURE sp_getAllInspectorsByBranches(
    IN p_branch_ids VARCHAR(500)
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            i.inspector_id,
            i.username,
            i.first_name,
            i.last_name,
            i.middle_name,
            i.email,
            i.contact_no,
            i.status,
            i.last_login,
            i.last_logout,
            i.created_at,
            ia.branch_id,
            ia.status as assignment_status,
            b.branch_name
        FROM inspector i
        LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = ''Active''
        LEFT JOIN branch b ON ia.branch_id = b.branch_id
        WHERE ia.branch_id IN (', p_branch_ids, ')
        ORDER BY i.created_at DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_getAllCollectorsByBranches
-- Purpose: Get collectors filtered by branch IDs
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getAllCollectorsByBranches//
CREATE PROCEDURE sp_getAllCollectorsByBranches(
    IN p_branch_ids VARCHAR(500)
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            c.collector_id,
            c.username,
            c.first_name,
            c.last_name,
            c.middle_name,
            c.email,
            c.contact_no,
            c.status,
            c.last_login,
            c.last_logout,
            c.created_at,
            ca.branch_id,
            ca.status as assignment_status,
            b.branch_name
        FROM collector c
        LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = ''Active''
        LEFT JOIN branch b ON ca.branch_id = b.branch_id
        WHERE ca.branch_id IN (', p_branch_ids, ')
        ORDER BY c.created_at DESC'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- SP: sp_createInspector
-- Purpose: Create a new inspector
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createInspector//
CREATE PROCEDURE sp_createInspector(
    IN p_username VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_created_at DATETIME
)
BEGIN
    INSERT INTO inspector (
        username, first_name, last_name, middle_name, 
        email, contact_no, password, status, created_at
    ) VALUES (
        p_username, p_first_name, p_last_name, p_middle_name,
        p_email, p_contact_no, p_password_hash, p_status, p_created_at
    );
    
    SELECT LAST_INSERT_ID() as inspector_id;
END//

-- =====================================================
-- SP: sp_createInspectorAssignment
-- Purpose: Assign inspector to a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createInspectorAssignment//
CREATE PROCEDURE sp_createInspectorAssignment(
    IN p_inspector_id INT,
    IN p_branch_id INT,
    IN p_assigned_by INT,
    IN p_status VARCHAR(50),
    IN p_assigned_at DATETIME
)
BEGIN
    INSERT INTO inspector_assignment (
        inspector_id, branch_id, assigned_by, status, assigned_at
    ) VALUES (
        p_inspector_id, p_branch_id, p_assigned_by, p_status, p_assigned_at
    );
    
    SELECT LAST_INSERT_ID() as assignment_id;
END//

-- =====================================================
-- SP: sp_createCollector
-- Purpose: Create a new collector
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createCollector//
CREATE PROCEDURE sp_createCollector(
    IN p_username VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_middle_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_status VARCHAR(50),
    IN p_created_at DATETIME
)
BEGIN
    INSERT INTO collector (
        username, first_name, last_name, middle_name, 
        email, contact_no, password_hash, status, created_at
    ) VALUES (
        p_username, p_first_name, p_last_name, p_middle_name,
        p_email, p_contact_no, p_password_hash, p_status, p_created_at
    );
    
    SELECT LAST_INSERT_ID() as collector_id;
END//

-- =====================================================
-- SP: sp_createCollectorAssignment
-- Purpose: Assign collector to a branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createCollectorAssignment//
CREATE PROCEDURE sp_createCollectorAssignment(
    IN p_collector_id INT,
    IN p_branch_id INT,
    IN p_assigned_by INT,
    IN p_status VARCHAR(50),
    IN p_assigned_at DATETIME
)
BEGIN
    INSERT INTO collector_assignment (
        collector_id, branch_id, assigned_by, status, assigned_at
    ) VALUES (
        p_collector_id, p_branch_id, p_assigned_by, p_status, p_assigned_at
    );
    
    SELECT LAST_INSERT_ID() as assignment_id;
END//

-- =====================================================
-- SP: sp_updateInspectorStatus
-- Purpose: Update inspector status (activate/deactivate)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateInspectorStatus//
CREATE PROCEDURE sp_updateInspectorStatus(
    IN p_inspector_id INT,
    IN p_status VARCHAR(50)
)
BEGIN
    UPDATE inspector 
    SET status = p_status 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_updateCollectorStatus
-- Purpose: Update collector status (activate/deactivate)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_updateCollectorStatus//
CREATE PROCEDURE sp_updateCollectorStatus(
    IN p_collector_id INT,
    IN p_status VARCHAR(50)
)
BEGIN
    UPDATE collector 
    SET status = p_status 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_createInspectorDirect
-- Purpose: Create inspector with date_hired column
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createInspectorDirect//
CREATE PROCEDURE sp_createInspectorDirect(
    IN p_username VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_contact_no VARCHAR(50)
)
BEGIN
    INSERT INTO inspector (
        username, first_name, last_name, middle_name, 
        email, password, contact_no, date_hired, status
    ) VALUES (
        p_username, p_first_name, p_last_name, '',
        p_email, p_password_hash, p_contact_no, CURDATE(), 'active'
    );
    
    SELECT LAST_INSERT_ID() as inspector_id;
END//

-- =====================================================
-- SP: sp_createInspectorAssignmentDirect
-- Purpose: Create inspector assignment with start_date
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createInspectorAssignmentDirect//
CREATE PROCEDURE sp_createInspectorAssignmentDirect(
    IN p_inspector_id INT,
    IN p_branch_id INT,
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO inspector_assignment (
        inspector_id, branch_id, start_date, status, remarks
    ) VALUES (
        p_inspector_id, p_branch_id, CURDATE(), 'Active', p_remarks
    );
    
    SELECT LAST_INSERT_ID() as assignment_id;
END//

-- =====================================================
-- SP: sp_logInspectorAction
-- Purpose: Log inspector actions
-- =====================================================
DROP PROCEDURE IF EXISTS sp_logInspectorAction//
CREATE PROCEDURE sp_logInspectorAction(
    IN p_inspector_id INT,
    IN p_branch_id INT,
    IN p_business_manager_id INT,
    IN p_action_type VARCHAR(50),
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO inspector_action_log (
        inspector_id, branch_id, business_manager_id, 
        action_type, action_date, remarks
    ) VALUES (
        p_inspector_id, p_branch_id, p_business_manager_id,
        p_action_type, NOW(), p_remarks
    );
END//

-- =====================================================
-- SP: sp_createCollectorDirect
-- Purpose: Create collector with date_hired column
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createCollectorDirect//
CREATE PROCEDURE sp_createCollectorDirect(
    IN p_username VARCHAR(100),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_contact_no VARCHAR(50)
)
BEGIN
    INSERT INTO collector (
        username, password_hash, first_name, last_name, 
        email, contact_no, date_hired, status
    ) VALUES (
        p_username, p_password_hash, p_first_name, p_last_name,
        p_email, p_contact_no, CURDATE(), 'active'
    );
    
    SELECT LAST_INSERT_ID() as collector_id;
END//

-- =====================================================
-- SP: sp_createCollectorAssignmentDirect
-- Purpose: Create collector assignment with start_date
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createCollectorAssignmentDirect//
CREATE PROCEDURE sp_createCollectorAssignmentDirect(
    IN p_collector_id INT,
    IN p_branch_id INT,
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO collector_assignment (
        collector_id, branch_id, start_date, status, remarks
    ) VALUES (
        p_collector_id, p_branch_id, CURDATE(), 'Active', p_remarks
    );
    
    SELECT LAST_INSERT_ID() as assignment_id;
END//

-- =====================================================
-- SP: sp_logCollectorAction
-- Purpose: Log collector actions
-- =====================================================
DROP PROCEDURE IF EXISTS sp_logCollectorAction//
CREATE PROCEDURE sp_logCollectorAction(
    IN p_collector_id INT,
    IN p_branch_id INT,
    IN p_business_manager_id INT,
    IN p_action_type VARCHAR(50),
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO collector_action_log (
        collector_id, branch_id, business_manager_id, 
        action_type, action_date, remarks
    ) VALUES (
        p_collector_id, p_branch_id, p_business_manager_id,
        p_action_type, NOW(), p_remarks
    );
END//

-- =====================================================
-- SP: sp_getInspectorsByBranch
-- Purpose: Get inspectors for a specific branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getInspectorsByBranch//
CREATE PROCEDURE sp_getInspectorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        i.last_logout,
        COALESCE(ia.branch_id, p_branch_id) as branch_id,
        COALESCE(b.branch_name, 'Unassigned') as branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (ia.branch_id = p_branch_id OR ia.branch_id IS NULL)
      AND i.status IN ('active', 'Active')
    ORDER BY i.date_hired DESC;
END//

-- =====================================================
-- SP: sp_getInspectorsAll
-- Purpose: Get all inspectors
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getInspectorsAll//
CREATE PROCEDURE sp_getInspectorsAll()
BEGIN
    SELECT 
        i.inspector_id,
        i.username,
        i.first_name,
        i.last_name,
        i.email,
        i.contact_no,
        i.date_hired,
        i.status,
        i.last_login,
        i.last_logout,
        ia.branch_id,
        b.branch_name
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE i.status IN ('active', 'Active')
    ORDER BY i.date_hired DESC;
END//

-- =====================================================
-- SP: sp_getCollectorsByBranch
-- Purpose: Get collectors for a specific branch
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getCollectorsByBranch//
CREATE PROCEDURE sp_getCollectorsByBranch(
    IN p_branch_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.date_created,
        c.last_login,
        c.last_logout,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE ca.branch_id = p_branch_id
    ORDER BY c.date_created DESC;
END//

-- =====================================================
-- SP: sp_getCollectorsAll
-- Purpose: Get all collectors
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getCollectorsAll//
CREATE PROCEDURE sp_getCollectorsAll()
BEGIN
    SELECT 
        c.collector_id,
        c.first_name,
        c.last_name,
        c.email,
        c.contact_no,
        c.date_hired,
        c.status,
        c.date_created,
        c.last_login,
        c.last_logout,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    ORDER BY c.date_created DESC;
END//

-- =====================================================
-- SP: sp_terminateInspector
-- Purpose: Terminate inspector with reason
-- =====================================================
DROP PROCEDURE IF EXISTS sp_terminateInspector//
CREATE PROCEDURE sp_terminateInspector(
    IN p_inspector_id INT,
    IN p_reason VARCHAR(500)
)
BEGIN
    UPDATE inspector 
    SET status = 'inactive', 
        termination_date = CURDATE(), 
        termination_reason = p_reason 
    WHERE inspector_id = p_inspector_id;
    
    UPDATE inspector_assignment 
    SET status = 'Inactive', end_date = CURDATE() 
    WHERE inspector_id = p_inspector_id AND status = 'Active';
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_terminateCollector
-- Purpose: Terminate collector with reason
-- =====================================================
DROP PROCEDURE IF EXISTS sp_terminateCollector//
CREATE PROCEDURE sp_terminateCollector(
    IN p_collector_id INT,
    IN p_reason VARCHAR(500)
)
BEGIN
    UPDATE collector 
    SET status = 'inactive', 
        termination_date = CURDATE(), 
        termination_reason = p_reason 
    WHERE collector_id = p_collector_id;
    
    UPDATE collector_assignment 
    SET status = 'Inactive', end_date = CURDATE() 
    WHERE collector_id = p_collector_id AND status = 'Active';
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_resetInspectorPassword
-- Purpose: Reset inspector password
-- =====================================================
DROP PROCEDURE IF EXISTS sp_resetInspectorPassword//
CREATE PROCEDURE sp_resetInspectorPassword(
    IN p_inspector_id INT,
    IN p_password_hash VARCHAR(255)
)
BEGIN
    UPDATE inspector 
    SET password_hash = p_password_hash 
    WHERE inspector_id = p_inspector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_resetCollectorPassword
-- Purpose: Reset collector password
-- =====================================================
DROP PROCEDURE IF EXISTS sp_resetCollectorPassword//
CREATE PROCEDURE sp_resetCollectorPassword(
    IN p_collector_id INT,
    IN p_password_hash VARCHAR(255)
)
BEGIN
    UPDATE collector 
    SET password_hash = p_password_hash 
    WHERE collector_id = p_collector_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;

-- Success message
SELECT 'Mobile Staff Controller stored procedures created successfully' as status;
