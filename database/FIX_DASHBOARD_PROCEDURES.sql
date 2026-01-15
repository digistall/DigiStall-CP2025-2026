-- =====================================================
-- FIX_DASHBOARD_PROCEDURES.sql
-- Description: Creates all missing stored procedures for Dashboard
-- Fixes: 500 errors on /api/stalls, /api/payments/onsite, /api/employees,
--        /api/mobile-staff/inspectors, /api/mobile-staff/collectors
-- Date: 2026-01-15
-- =====================================================

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

DELIMITER //

-- =====================================================
-- 1. STALL PROCEDURES
-- =====================================================

-- SP: sp_getAllStalls_complete
-- Purpose: Get all stalls with payment status
DROP PROCEDURE IF EXISTS sp_getAllStalls_complete//
CREATE PROCEDURE sp_getAllStalls_complete(
    IN p_user_id INT, 
    IN p_user_type VARCHAR(50), 
    IN p_branch_id INT
)
BEGIN
    DECLARE v_current_month VARCHAR(7) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
    SET v_current_month = DATE_FORMAT(CURDATE(), '%Y-%m');
    
    IF p_user_type COLLATE utf8mb4_general_ci = 'stall_business_owner' THEN
        
        SELECT 
            s.stall_id, s.stall_no, s.stall_location, s.size, s.floor_id, f.floor_name,
            s.section_id, sec.section_name, s.rental_price, s.price_type, s.status,
            s.stamp, s.description, si.image_url as stall_image, s.is_available,
            s.raffle_auction_deadline, s.deadline_active, s.raffle_auction_status,
            s.created_by_business_manager, s.created_at, s.updated_at,
            b.branch_id, b.branch_name, b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                        ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id, sh.stallholder_name, sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            CASE 
                WHEN sh.stallholder_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                ) THEN 1 ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id IN (
            SELECT DISTINCT bm.branch_id FROM business_owner_managers bom
            INNER JOIN business_manager bm ON bom.business_manager_id = bm.business_manager_id
            WHERE bom.business_owner_id = p_user_id AND bom.status COLLATE utf8mb4_general_ci = 'Active'
        )
        ORDER BY b.branch_name, s.created_at DESC;

    ELSEIF p_user_type COLLATE utf8mb4_general_ci = 'system_administrator' THEN
        
        SELECT 
            s.stall_id, s.stall_no, s.stall_location, s.size, s.floor_id, f.floor_name,
            s.section_id, sec.section_name, s.rental_price, s.price_type, s.status,
            s.stamp, s.description, si.image_url as stall_image, s.is_available,
            s.raffle_auction_deadline, s.deadline_active, s.raffle_auction_status,
            s.created_by_business_manager, s.created_at, s.updated_at,
            b.branch_id, b.branch_name, b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                        ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id, sh.stallholder_name, sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            CASE 
                WHEN sh.stallholder_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                ) THEN 1 ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        ORDER BY b.branch_name, s.created_at DESC;

    ELSE
        -- business_manager - filter by their branch
        SELECT 
            s.stall_id, s.stall_no, s.stall_location, s.size, s.floor_id, f.floor_name,
            s.section_id, sec.section_name, s.rental_price, s.price_type, s.status,
            s.stamp, s.description, si.image_url as stall_image, s.is_available,
            s.raffle_auction_deadline, s.deadline_active, s.raffle_auction_status,
            s.created_by_business_manager, s.created_at, s.updated_at,
            b.branch_id, b.branch_name, b.area,
            CASE 
                WHEN sh.stall_id IS NULL THEN 
                    CASE WHEN s.is_available = 1 THEN 'Available' ELSE 'Unavailable' END
                WHEN sh.stall_id IS NOT NULL THEN
                    CASE 
                        WHEN EXISTS (
                            SELECT 1 FROM payments p 
                            WHERE p.stallholder_id = sh.stallholder_id 
                            AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                            AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                            AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                        ) THEN 'Occupied'
                        ELSE 'Overdue'
                    END
            END as availability_status,
            sh.stallholder_id, sh.stallholder_name, sh.payment_status as stallholder_payment_status,
            sh.contract_start_date,
            CASE 
                WHEN sh.stallholder_id IS NOT NULL AND EXISTS (
                    SELECT 1 FROM payments p 
                    WHERE p.stallholder_id = sh.stallholder_id 
                    AND p.payment_type COLLATE utf8mb4_general_ci = 'rental'
                    AND p.payment_for_month COLLATE utf8mb4_general_ci = v_current_month
                    AND p.payment_status COLLATE utf8mb4_general_ci = 'completed'
                ) THEN 1 ELSE 0
            END as rental_paid_current_month
        FROM stall s
        INNER JOIN section sec ON s.section_id = sec.section_id
        INNER JOIN floor f ON s.floor_id = f.floor_id
        INNER JOIN branch b ON f.branch_id = b.branch_id
        LEFT JOIN stallholder sh ON s.stall_id = sh.stall_id AND sh.contract_status COLLATE utf8mb4_general_ci = 'Active'
        LEFT JOIN stall_images si ON s.stall_id = si.stall_id AND si.is_primary = 1
        WHERE b.branch_id = p_branch_id
        ORDER BY s.created_at DESC;
        
    END IF;
END//

-- =====================================================
-- 2. PAYMENT PROCEDURES
-- =====================================================

-- SP: sp_getOnsitePaymentsAll
-- Purpose: Get all onsite payments (for system admin)
DROP PROCEDURE IF EXISTS sp_getOnsitePaymentsAll//
CREATE PROCEDURE sp_getOnsitePaymentsAll(
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        p.payment_id as id,
        p.stallholder_id as stallholderId,
        sh.stallholder_name as stallholderName,
        COALESCE(st.stall_no, 'N/A') as stallNo,
        p.amount as amountPaid,
        p.payment_date as paymentDate,
        p.payment_time as paymentTime,
        p.payment_for_month as paymentForMonth,
        p.payment_type as paymentType,
        'Cash (Onsite)' as paymentMethod,
        p.reference_number as referenceNo,
        p.collected_by as collectedBy,
        p.notes,
        p.payment_status as status,
        p.created_at as createdAt,
        COALESCE(b.branch_name, 'Unknown') as branchName
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE p.payment_method = 'onsite'
    AND (
        p_search = '' OR
        p.reference_number LIKE CONCAT('%', p_search, '%') OR
        sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
        st.stall_no LIKE CONCAT('%', p_search, '%')
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- SP: sp_getOnsitePaymentsByBranches
-- Purpose: Get onsite payments filtered by branch IDs
DROP PROCEDURE IF EXISTS sp_getOnsitePaymentsByBranches//
CREATE PROCEDURE sp_getOnsitePaymentsByBranches(
    IN p_branch_ids VARCHAR(500),
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SET @sql = CONCAT('
        SELECT 
            p.payment_id as id,
            p.stallholder_id as stallholderId,
            sh.stallholder_name as stallholderName,
            COALESCE(st.stall_no, ''N/A'') as stallNo,
            p.amount as amountPaid,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.payment_for_month as paymentForMonth,
            p.payment_type as paymentType,
            ''Cash (Onsite)'' as paymentMethod,
            p.reference_number as referenceNo,
            p.collected_by as collectedBy,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            COALESCE(b.branch_name, ''Unknown'') as branchName
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.branch_id IN (', p_branch_ids, ')
        AND p.payment_method = ''onsite''
        AND (
            ''', p_search, ''' = '''' OR
            p.reference_number LIKE ''%', p_search, '%'' OR
            sh.stallholder_name LIKE ''%', p_search, '%'' OR
            st.stall_no LIKE ''%', p_search, '%''
        )
        ORDER BY p.created_at DESC
        LIMIT ', p_limit, ' OFFSET ', p_offset
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

-- =====================================================
-- 3. EMPLOYEE PROCEDURES
-- =====================================================

-- SP: sp_getAllEmployeesAll
-- Purpose: Get all business employees (for system admin)
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

-- SP: sp_getAllEmployeesByBranches
-- Purpose: Get business employees filtered by branch IDs
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
-- 4. MOBILE STAFF PROCEDURES (INSPECTORS & COLLECTORS)
-- =====================================================

-- SP: sp_checkCollectorTableExists
-- Purpose: Check if collector table exists
DROP PROCEDURE IF EXISTS sp_checkCollectorTableExists//
CREATE PROCEDURE sp_checkCollectorTableExists()
BEGIN
    SELECT TABLE_NAME 
    FROM information_schema.TABLES 
    WHERE TABLE_SCHEMA = DATABASE() 
    AND TABLE_NAME = 'collector';
END//

-- SP: sp_getInspectorsByBranch
-- Purpose: Get inspectors for a specific branch
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

-- SP: sp_getInspectorsAll
-- Purpose: Get all inspectors
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

-- SP: sp_getCollectorsByBranch
-- Purpose: Get collectors for a specific branch
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

-- SP: sp_getCollectorsAll
-- Purpose: Get all collectors
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

DELIMITER ;

-- =====================================================
-- VERIFICATION: Check that all procedures were created
-- =====================================================
SELECT 'Procedures created successfully!' as status;
SELECT 
    ROUTINE_NAME as procedure_name,
    CREATED as created_at
FROM information_schema.ROUTINES 
WHERE ROUTINE_SCHEMA = DATABASE()
AND ROUTINE_NAME IN (
    'sp_getAllStalls_complete',
    'sp_getOnsitePaymentsAll',
    'sp_getOnsitePaymentsByBranches',
    'sp_getAllEmployeesAll',
    'sp_getAllEmployeesByBranches',
    'sp_checkCollectorTableExists',
    'sp_getInspectorsByBranch',
    'sp_getInspectorsAll',
    'sp_getCollectorsByBranch',
    'sp_getCollectorsAll'
)
ORDER BY ROUTINE_NAME;
