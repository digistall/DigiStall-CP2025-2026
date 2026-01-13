-- Migration: 253_mobileStaffLogin.sql
-- Description: Stored procedures for mobile staff (inspector/collector) authentication
-- Date: 2025-12-09

DELIMITER $$

-- ========================================
-- LOGIN INSPECTOR PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `loginInspector`$$

CREATE PROCEDURE `loginInspector` (
    IN p_username VARCHAR(50),
    IN p_update_login BOOLEAN
)
BEGIN
    -- Get inspector details
    SELECT 
        i.inspector_id,
        i.username,
        i.password_hash,
        COALESCE(i.password_hash, i.password) as password_check,
        i.first_name,
        i.last_name,
        i.middle_name,
        i.email,
        i.contact_no,
        i.status,
        ia.branch_id,
        b.branch_name,
        'inspector' as role_type
    FROM inspector i
    LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
    LEFT JOIN branch b ON ia.branch_id = b.branch_id
    WHERE (i.username = p_username OR i.email = p_username)
      AND i.status = 'active'
    LIMIT 1;
    
    -- Update last login if requested
    IF p_update_login THEN
        UPDATE inspector 
        SET date_created = NOW() 
        WHERE username = p_username OR email = p_username;
    END IF;
END$$

-- ========================================
-- LOGIN COLLECTOR PROCEDURE
-- ========================================

DROP PROCEDURE IF EXISTS `loginCollector`$$

CREATE PROCEDURE `loginCollector` (
    IN p_username VARCHAR(50),
    IN p_update_login BOOLEAN
)
BEGIN
    -- Get collector details
    SELECT 
        c.collector_id,
        c.username,
        c.password_hash,
        c.first_name,
        c.last_name,
        c.middle_name,
        c.email,
        c.contact_no,
        c.status,
        ca.branch_id,
        b.branch_name,
        'collector' as role_type
    FROM collector c
    LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
    LEFT JOIN branch b ON ca.branch_id = b.branch_id
    WHERE (c.username = p_username OR c.email = p_username)
      AND c.status = 'active'
    LIMIT 1;
    
    -- Update last login if requested
    IF p_update_login THEN
        UPDATE collector 
        SET last_login = NOW() 
        WHERE username = p_username OR email = p_username;
    END IF;
END$$

-- ========================================
-- UNIFIED MOBILE STAFF LOGIN PROCEDURE
-- Attempts to login as inspector first, then collector
-- ========================================

DROP PROCEDURE IF EXISTS `loginMobileStaff`$$

CREATE PROCEDURE `loginMobileStaff` (
    IN p_username VARCHAR(50)
)
BEGIN
    DECLARE v_found INT DEFAULT 0;
    
    -- First try inspector
    SELECT COUNT(*) INTO v_found
    FROM inspector 
    WHERE (username = p_username OR email = p_username) AND status = 'active';
    
    IF v_found > 0 THEN
        -- Return inspector data
        SELECT 
            i.inspector_id as staff_id,
            i.username,
            COALESCE(i.password_hash, i.password) as password_hash,
            i.first_name,
            i.last_name,
            i.email,
            i.contact_no,
            i.status,
            ia.branch_id,
            b.branch_name,
            'inspector' as staff_type
        FROM inspector i
        LEFT JOIN inspector_assignment ia ON i.inspector_id = ia.inspector_id AND ia.status = 'Active'
        LEFT JOIN branch b ON ia.branch_id = b.branch_id
        WHERE (i.username = p_username OR i.email = p_username)
          AND i.status = 'active'
        LIMIT 1;
    ELSE
        -- Try collector
        SELECT 
            c.collector_id as staff_id,
            c.username,
            c.password_hash,
            c.first_name,
            c.last_name,
            c.email,
            c.contact_no,
            c.status,
            ca.branch_id,
            b.branch_name,
            'collector' as staff_type
        FROM collector c
        LEFT JOIN collector_assignment ca ON c.collector_id = ca.collector_id AND ca.status = 'Active'
        LEFT JOIN branch b ON ca.branch_id = b.branch_id
        WHERE (c.username = p_username OR c.email = p_username)
          AND c.status = 'active'
        LIMIT 1;
    END IF;
END$$

DELIMITER ;
