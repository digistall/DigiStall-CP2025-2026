-- Migration 308: Payment Controller Stored Procedures
-- This creates stored procedures for all payment operations

DELIMITER //

-- =====================================================
-- SP: sp_getOnsitePaymentsAll
-- Purpose: Get all onsite payments (for system admin)
-- =====================================================
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

-- =====================================================
-- SP: sp_getOnsitePaymentsByBranches
-- Purpose: Get onsite payments filtered by branch IDs (for managers/owners)
-- =====================================================
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
-- SP: sp_getOnlinePaymentsAll
-- Purpose: Get all online payments (for system admin)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getOnlinePaymentsAll//
CREATE PROCEDURE sp_getOnlinePaymentsAll(
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
        CASE 
            WHEN p.payment_method = 'gcash' THEN 'GCash'
            WHEN p.payment_method = 'maya' THEN 'Maya'
            WHEN p.payment_method = 'paymaya' THEN 'PayMaya'
            WHEN p.payment_method = 'bank_transfer' THEN 'Bank Transfer'
            ELSE 'Online Payment'
        END as paymentMethod,
        p.reference_number as referenceNo,
        p.notes,
        p.payment_status as status,
        p.created_at as createdAt,
        COALESCE(b.branch_name, 'Unknown') as branchName
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    LEFT JOIN stall st ON sh.stall_id = st.stall_id
    LEFT JOIN branch b ON sh.branch_id = b.branch_id
    WHERE p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online')
    AND (
        p_search = '' OR
        p.reference_number LIKE CONCAT('%', p_search, '%') OR
        sh.stallholder_name LIKE CONCAT('%', p_search, '%') OR
        st.stall_no LIKE CONCAT('%', p_search, '%')
    )
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END//

-- =====================================================
-- SP: sp_getOnlinePaymentsByBranches
-- Purpose: Get online payments filtered by branch IDs
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getOnlinePaymentsByBranches//
CREATE PROCEDURE sp_getOnlinePaymentsByBranches(
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
            CASE 
                WHEN p.payment_method = ''gcash'' THEN ''GCash''
                WHEN p.payment_method = ''maya'' THEN ''Maya''
                WHEN p.payment_method = ''paymaya'' THEN ''PayMaya''
                WHEN p.payment_method = ''bank_transfer'' THEN ''Bank Transfer''
                ELSE ''Online Payment''
            END as paymentMethod,
            p.reference_number as referenceNo,
            p.notes,
            p.payment_status as status,
            p.created_at as createdAt,
            COALESCE(b.branch_name, ''Unknown'') as branchName
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        LEFT JOIN stall st ON sh.stall_id = st.stall_id
        LEFT JOIN branch b ON sh.branch_id = b.branch_id
        WHERE sh.branch_id IN (', p_branch_ids, ')
        AND p.payment_method IN (''gcash'', ''maya'', ''paymaya'', ''bank_transfer'', ''online'')
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
-- SP: sp_approvePayment
-- Purpose: Approve a payment
-- =====================================================
DROP PROCEDURE IF EXISTS sp_approvePayment//
CREATE PROCEDURE sp_approvePayment(
    IN p_payment_id INT,
    IN p_approved_by VARCHAR(255)
)
BEGIN
    UPDATE payments 
    SET payment_status = 'approved', 
        approved_by = p_approved_by, 
        approved_at = NOW() 
    WHERE payment_id = p_payment_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_declinePayment
-- Purpose: Decline a payment with reason
-- =====================================================
DROP PROCEDURE IF EXISTS sp_declinePayment//
CREATE PROCEDURE sp_declinePayment(
    IN p_payment_id INT,
    IN p_declined_by VARCHAR(255),
    IN p_decline_reason TEXT
)
BEGIN
    UPDATE payments 
    SET payment_status = 'declined', 
        declined_by = p_declined_by, 
        declined_at = NOW(), 
        decline_reason = p_decline_reason 
    WHERE payment_id = p_payment_id;
    
    SELECT ROW_COUNT() as affected_rows;
END//

-- =====================================================
-- SP: sp_getPaymentStatsAll
-- Purpose: Get payment statistics (for system admin)
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getPaymentStatsAll//
CREATE PROCEDURE sp_getPaymentStatsAll(
    IN p_month VARCHAR(10)
)
BEGIN
    SELECT
        COUNT(*) as totalPayments,
        SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN 1 ELSE 0 END) as onlinePayments,
        SUM(CASE WHEN p.payment_method = 'onsite' THEN 1 ELSE 0 END) as onsitePayments,
        COALESCE(SUM(p.amount), 0) as totalAmount,
        COALESCE(SUM(CASE WHEN p.payment_method IN ('gcash', 'maya', 'paymaya', 'bank_transfer', 'online') THEN p.amount ELSE 0 END), 0) as onlineAmount,
        COALESCE(SUM(CASE WHEN p.payment_method = 'onsite' THEN p.amount ELSE 0 END), 0) as onsiteAmount,
        COUNT(CASE WHEN p.payment_status = 'completed' THEN 1 END) as completedPayments,
        COUNT(CASE WHEN p.payment_status = 'pending' THEN 1 END) as pendingPayments,
        SUM(CASE WHEN p.payment_method = 'gcash' THEN 1 ELSE 0 END) as gcashCount,
        SUM(CASE WHEN p.payment_method = 'maya' THEN 1 ELSE 0 END) as mayaCount,
        SUM(CASE WHEN p.payment_method = 'paymaya' THEN 1 ELSE 0 END) as paymayaCount,
        SUM(CASE WHEN p.payment_method = 'bank_transfer' THEN 1 ELSE 0 END) as bankTransferCount
    FROM payments p
    INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
    WHERE (p_month IS NULL OR p_month = '' OR p.payment_for_month = p_month);
END//

-- =====================================================
-- SP: sp_getPaymentStatsByBranches
-- Purpose: Get payment statistics filtered by branches
-- =====================================================
DROP PROCEDURE IF EXISTS sp_getPaymentStatsByBranches//
CREATE PROCEDURE sp_getPaymentStatsByBranches(
    IN p_branch_ids VARCHAR(500),
    IN p_month VARCHAR(10)
)
BEGIN
    SET @sql = CONCAT('
        SELECT
            COUNT(*) as totalPayments,
            SUM(CASE WHEN p.payment_method IN (''gcash'', ''maya'', ''paymaya'', ''bank_transfer'', ''online'') THEN 1 ELSE 0 END) as onlinePayments,
            SUM(CASE WHEN p.payment_method = ''onsite'' THEN 1 ELSE 0 END) as onsitePayments,
            COALESCE(SUM(p.amount), 0) as totalAmount,
            COALESCE(SUM(CASE WHEN p.payment_method IN (''gcash'', ''maya'', ''paymaya'', ''bank_transfer'', ''online'') THEN p.amount ELSE 0 END), 0) as onlineAmount,
            COALESCE(SUM(CASE WHEN p.payment_method = ''onsite'' THEN p.amount ELSE 0 END), 0) as onsiteAmount,
            COUNT(CASE WHEN p.payment_status = ''completed'' THEN 1 END) as completedPayments,
            COUNT(CASE WHEN p.payment_status = ''pending'' THEN 1 END) as pendingPayments,
            SUM(CASE WHEN p.payment_method = ''gcash'' THEN 1 ELSE 0 END) as gcashCount,
            SUM(CASE WHEN p.payment_method = ''maya'' THEN 1 ELSE 0 END) as mayaCount,
            SUM(CASE WHEN p.payment_method = ''paymaya'' THEN 1 ELSE 0 END) as paymayaCount,
            SUM(CASE WHEN p.payment_method = ''bank_transfer'' THEN 1 ELSE 0 END) as bankTransferCount
        FROM payments p
        INNER JOIN stallholder sh ON p.stallholder_id = sh.stallholder_id
        WHERE sh.branch_id IN (', p_branch_ids, ')
        AND (''', IFNULL(p_month, ''), ''' = '''' OR p.payment_for_month = ''', IFNULL(p_month, ''), ''')'
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END//

DELIMITER ;

-- Success message
SELECT 'Payment Controller stored procedures created successfully' as status;
