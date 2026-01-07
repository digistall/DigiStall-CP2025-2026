-- Migration: 251_createCollectorProcedures.sql
-- Description: Stored procedures for collector account management
-- Date: 2025-12-09

DELIMITER $$

-- ========================================
-- CREATE COLLECTOR PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `createCollector`$$

CREATE PROCEDURE `createCollector` (
    IN p_username VARCHAR(50),
    IN p_password_hash VARCHAR(255),
    IN p_first_name VARCHAR(100),
    IN p_last_name VARCHAR(100),
    IN p_email VARCHAR(255),
    IN p_contact_no VARCHAR(20),
    IN p_branch_id INT,
    IN p_date_hired DATE,
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE new_collector_id INT;
    DECLARE exit_handler BOOLEAN DEFAULT FALSE;
    
    DECLARE CONTINUE HANDLER FOR SQLEXCEPTION SET exit_handler = TRUE;
    
    -- Insert collector
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
        IFNULL(p_date_hired, CURDATE()),
        'active'
    );
    
    IF exit_handler THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Failed to create collector';
    END IF;
    
    SET new_collector_id = LAST_INSERT_ID();
    
    -- Create branch assignment
    INSERT INTO collector_assignment (
        collector_id,
        branch_id,
        start_date,
        status,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        CURDATE(),
        'Active',
        'Newly hired collector'
    );
    
    -- Log the action
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        new_collector_id,
        p_branch_id,
        p_branch_manager_id,
        'New Hire',
        NOW(),
        CONCAT('Collector ', p_first_name, ' ', p_last_name, ' was hired and assigned to branch ID ', p_branch_id)
    );
    
    -- Return the new collector
    SELECT 
        new_collector_id as collector_id,
        p_username as username,
        p_first_name as first_name,
        p_last_name as last_name,
        p_email as email,
        'Collector created successfully' as message;
END$$

-- ========================================
-- GET COLLECTOR BY USERNAME PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `getCollectorByUsername`$$

CREATE PROCEDURE `getCollectorByUsername` (
    IN p_username VARCHAR(50)
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE c.username = p_username AND c.status = 'active'
    LIMIT 1;
END$$

-- ========================================
-- GET ALL COLLECTORS BY BRANCH PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `getCollectorsByBranch`$$

CREATE PROCEDURE `getCollectorsByBranch` (
    IN p_branch_id INT
)
BEGIN
    SELECT 
        c.collector_id,
        c.username,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.date_created,
        c.date_hired,
        c.status,
        c.last_login,
        ca.branch_id,
        b.branch_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE ca.branch_id = p_branch_id
    ORDER BY c.date_created DESC;
END$$

-- ========================================
-- UPDATE COLLECTOR LOGIN PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `updateCollectorLogin`$$

CREATE PROCEDURE `updateCollectorLogin` (
    IN p_collector_id INT
)
BEGIN
    UPDATE collector 
    SET last_login = CURRENT_TIMESTAMP 
    WHERE collector_id = p_collector_id;
END$$

-- ========================================
-- TERMINATE COLLECTOR PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `terminateCollector`$$

CREATE PROCEDURE `terminateCollector` (
    IN p_collector_id INT,
    IN p_reason VARCHAR(255),
    IN p_branch_manager_id INT
)
BEGIN
    DECLARE v_branch_id INT;
    DECLARE v_first_name VARCHAR(100);
    DECLARE v_last_name VARCHAR(100);
    
    -- Get current assignment info
    SELECT ca.branch_id, c.first_name, c.last_name 
    INTO v_branch_id, v_first_name, v_last_name
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    WHERE c.collector_id = p_collector_id
    LIMIT 1;
    
    -- Update collector status
    UPDATE collector 
    SET status = 'inactive',
        termination_date = CURDATE(),
        termination_reason = p_reason
    WHERE collector_id = p_collector_id;
    
    -- Update assignment status
    UPDATE collector_assignment 
    SET status = 'Inactive',
        end_date = CURDATE()
    WHERE collector_id = p_collector_id AND status = 'Active';
    
    -- Log the termination
    INSERT INTO collector_action_log (
        collector_id,
        branch_id,
        business_manager_id,
        action_type,
        action_date,
        remarks
    ) VALUES (
        p_collector_id,
        v_branch_id,
        p_branch_manager_id,
        'Termination',
        NOW(),
        CONCAT('Collector ', v_first_name, ' ', v_last_name, ' was terminated. Reason: ', p_reason)
    );
    
    SELECT 'Collector terminated successfully' as message;
END$$

DELIMITER ;
