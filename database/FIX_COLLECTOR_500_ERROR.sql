-- =====================================================
-- FIX: Collector 500 Error and Missing Stored Procedures
-- Run this SQL file to fix the collector endpoint error
-- =====================================================

DELIMITER //

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
        c.username,
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
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
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
        c.username,
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
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status COLLATE utf8mb4_general_ci = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    ORDER BY c.date_created DESC;
END//

-- =====================================================
-- SP: sp_createCollectorDirect
-- Purpose: Create a new collector directly
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createCollectorDirect//
CREATE PROCEDURE sp_createCollectorDirect(
    IN p_username VARCHAR(50),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_password_hash VARCHAR(255),
    IN p_contact_no VARCHAR(20)
)
BEGIN
    INSERT INTO collector (
        username,
        password_hash,
        first_name,
        last_name,
        email,
        contact_no,
        date_hired,
        status
    ) VALUES (
        p_username,
        p_password_hash,
        p_first_name,
        p_last_name,
        p_email,
        p_contact_no,
        CURDATE(),
        'active'
    );
    
    SELECT LAST_INSERT_ID() as collector_id;
END//

-- =====================================================
-- SP: sp_createCollectorAssignmentDirect
-- Purpose: Create collector branch assignment
-- =====================================================
DROP PROCEDURE IF EXISTS sp_createCollectorAssignmentDirect//
CREATE PROCEDURE sp_createCollectorAssignmentDirect(
    IN p_collector_id INT,
    IN p_branch_id INT,
    IN p_remarks VARCHAR(500)
)
BEGIN
    INSERT INTO collector_assignment (
        collector_id,
        branch_id,
        start_date,
        status,
        remarks
    ) VALUES (
        p_collector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        COALESCE(p_remarks, 'Newly hired collector')
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
    IN p_manager_id INT,
    IN p_action_type VARCHAR(50),
    IN p_remarks TEXT
)
BEGIN
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        p_collector_id,
        p_branch_id,
        p_manager_id,
        p_action_type,
        NOW(),
        p_remarks
    );
    
    SELECT LAST_INSERT_ID() as log_id;
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
    WHERE collector_id = p_collector_id AND status = 'Active'
    LIMIT 1;
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

DELIMITER ;

-- =====================================================
-- CREATE TABLES IF NOT EXISTS
-- =====================================================

-- Create collector table if not exists
CREATE TABLE IF NOT EXISTS collector (
    collector_id INT NOT NULL AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100) DEFAULT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    contact_no VARCHAR(20) DEFAULT NULL,
    date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
    date_hired DATE DEFAULT (CURDATE()),
    status ENUM('active','inactive') DEFAULT 'active',
    termination_date DATE DEFAULT NULL,
    termination_reason VARCHAR(255) DEFAULT NULL,
    last_login TIMESTAMP NULL DEFAULT NULL,
    last_logout TIMESTAMP NULL DEFAULT NULL,
    PRIMARY KEY (collector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create collector_assignment table if not exists
CREATE TABLE IF NOT EXISTS collector_assignment (
    assignment_id INT NOT NULL AUTO_INCREMENT,
    collector_id INT NOT NULL,
    branch_id INT NOT NULL,
    start_date DATE DEFAULT (CURDATE()),
    end_date DATE DEFAULT NULL,
    status ENUM('Active','Inactive','Transferred') DEFAULT 'Active',
    remarks TEXT DEFAULT NULL,
    PRIMARY KEY (assignment_id),
    KEY fk_collector_assignment (collector_id),
    KEY fk_collector_branch (branch_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Create collector_action_log table if not exists
CREATE TABLE IF NOT EXISTS collector_action_log (
    action_id INT NOT NULL AUTO_INCREMENT,
    collector_id INT NOT NULL,
    branch_id INT DEFAULT NULL,
    business_manager_id INT DEFAULT NULL,
    action_type ENUM('New Hire','Termination','Rehire','Transfer') NOT NULL,
    action_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    remarks TEXT DEFAULT NULL,
    PRIMARY KEY (action_id),
    KEY fk_collector_action_log (collector_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SELECT 'Collector fix applied successfully!' as status;
