-- =============================================
-- STAFF ACTIVITY LOG STORED PROCEDURES
-- Migration: 323_sp_staffActivityLog.sql
-- Purpose: Convert raw SQL queries in staffActivityLogController.js to stored procedures
-- =============================================

DELIMITER //

-- =============================================
-- INSERT STAFF ACTIVITY LOG
-- =============================================
DROP PROCEDURE IF EXISTS sp_insertStaffActivityLog//
CREATE PROCEDURE sp_insertStaffActivityLog(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_staff_name VARCHAR(255),
    IN p_branch_id INT,
    IN p_action_type VARCHAR(100),
    IN p_action_description TEXT,
    IN p_module VARCHAR(100),
    IN p_ip_address VARCHAR(50),
    IN p_user_agent TEXT,
    IN p_request_method VARCHAR(10),
    IN p_request_path VARCHAR(500),
    IN p_status VARCHAR(20)
)
BEGIN
    INSERT INTO staff_activity_log 
    (staff_type, staff_id, staff_name, branch_id, action_type, action_description, 
     module, ip_address, user_agent, request_method, request_path, status, created_at)
    VALUES (p_staff_type, p_staff_id, p_staff_name, p_branch_id, p_action_type, p_action_description,
            p_module, p_ip_address, p_user_agent, p_request_method, p_request_path, p_status, NOW());
    
    SELECT LAST_INSERT_ID() as log_id;
END//

-- =============================================
-- GET ALL STAFF ACTIVITIES WITH FILTERS
-- =============================================
DROP PROCEDURE IF EXISTS sp_getAllStaffActivities//
CREATE PROCEDURE sp_getAllStaffActivities(
    IN p_branch_id INT,
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        log_id,
        staff_type,
        staff_id,
        staff_name,
        branch_id,
        action_type,
        action_description,
        module,
        ip_address,
        status,
        created_at
    FROM staff_activity_log
    WHERE (p_branch_id IS NULL OR branch_id = p_branch_id OR branch_id IS NULL)
      AND (p_staff_type IS NULL OR staff_type = p_staff_type)
      AND (p_staff_id IS NULL OR staff_id = p_staff_id)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= CONCAT(p_end_date, ' 23:59:59'))
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- =============================================
-- COUNT STAFF ACTIVITIES WITH FILTERS
-- =============================================
DROP PROCEDURE IF EXISTS sp_countStaffActivities//
CREATE PROCEDURE sp_countStaffActivities(
    IN p_branch_id INT,
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE
)
BEGIN
    SELECT COUNT(*) as total
    FROM staff_activity_log
    WHERE (p_branch_id IS NULL OR branch_id = p_branch_id OR branch_id IS NULL)
      AND (p_staff_type IS NULL OR staff_type = p_staff_type)
      AND (p_staff_id IS NULL OR staff_id = p_staff_id)
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= CONCAT(p_end_date, ' 23:59:59'));
END//

-- =============================================
-- GET STAFF ACTIVITY BY ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_getStaffActivityById//
CREATE PROCEDURE sp_getStaffActivityById(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        log_id,
        staff_type,
        staff_id,
        staff_name,
        branch_id,
        action_type,
        action_description,
        module,
        ip_address,
        status,
        created_at
    FROM staff_activity_log
    WHERE staff_type = p_staff_type AND staff_id = p_staff_id
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- =============================================
-- COUNT STAFF ACTIVITY BY ID
-- =============================================
DROP PROCEDURE IF EXISTS sp_countStaffActivityById//
CREATE PROCEDURE sp_countStaffActivityById(
    IN p_staff_type VARCHAR(50),
    IN p_staff_id INT
)
BEGIN
    SELECT COUNT(*) as total 
    FROM staff_activity_log
    WHERE staff_type = p_staff_type AND staff_id = p_staff_id;
END//

-- =============================================
-- GET ACTIVITY SUMMARY BY STAFF TYPE
-- =============================================
DROP PROCEDURE IF EXISTS sp_getActivitySummaryByType//
CREATE PROCEDURE sp_getActivitySummaryByType(
    IN p_branch_id INT,
    IN p_days INT
)
BEGIN
    SELECT 
        staff_type,
        COUNT(*) as activity_count
    FROM staff_activity_log
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL p_days DAY)
      AND (p_branch_id IS NULL OR branch_id = p_branch_id OR branch_id IS NULL)
    GROUP BY staff_type;
END//

-- =============================================
-- GET ACTIVITY SUMMARY BY ACTION TYPE
-- =============================================
DROP PROCEDURE IF EXISTS sp_getActivitySummaryByAction//
CREATE PROCEDURE sp_getActivitySummaryByAction(
    IN p_branch_id INT,
    IN p_days INT
)
BEGIN
    SELECT 
        action_type,
        COUNT(*) as count
    FROM staff_activity_log
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL p_days DAY)
      AND (p_branch_id IS NULL OR branch_id = p_branch_id OR branch_id IS NULL)
    GROUP BY action_type 
    ORDER BY count DESC 
    LIMIT 10;
END//

-- =============================================
-- GET MOST ACTIVE STAFF
-- =============================================
DROP PROCEDURE IF EXISTS sp_getMostActiveStaff//
CREATE PROCEDURE sp_getMostActiveStaff(
    IN p_branch_id INT,
    IN p_days INT
)
BEGIN
    SELECT 
        staff_type,
        staff_id,
        staff_name,
        COUNT(*) as activity_count
    FROM staff_activity_log
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL p_days DAY)
      AND (p_branch_id IS NULL OR branch_id = p_branch_id OR branch_id IS NULL)
    GROUP BY staff_type, staff_id, staff_name 
    ORDER BY activity_count DESC 
    LIMIT 10;
END//

-- =============================================
-- GET RECENT FAILED ACTIONS
-- =============================================
DROP PROCEDURE IF EXISTS sp_getRecentFailedActions//
CREATE PROCEDURE sp_getRecentFailedActions(
    IN p_branch_id INT,
    IN p_days INT
)
BEGIN
    SELECT 
        staff_type,
        staff_name,
        action_type,
        action_description,
        created_at
    FROM staff_activity_log
    WHERE status = 'failed' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL p_days DAY)
      AND (p_branch_id IS NULL OR branch_id = p_branch_id OR branch_id IS NULL)
    ORDER BY created_at DESC 
    LIMIT 10;
END//

-- =============================================
-- CLEAR ALL ACTIVITY LOGS
-- =============================================
DROP PROCEDURE IF EXISTS sp_clearAllActivityLogs//
CREATE PROCEDURE sp_clearAllActivityLogs()
BEGIN
    DELETE FROM staff_activity_log;
    SELECT ROW_COUNT() as affected_rows;
END//

DELIMITER ;
