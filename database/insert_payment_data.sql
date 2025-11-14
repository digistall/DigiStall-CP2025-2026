-- =====================================================
-- Payment Data Setup - Database Stored Procedures
-- November 13, 2025
-- =====================================================

USE naga_stall_db;

-- =====================================================
-- 1. CREATE STORED PROCEDURE TO INSERT PAYMENTS
-- =====================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `InsertSamplePayments`$$

CREATE PROCEDURE `InsertSamplePayments`()
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        RESIGNAL;
    END;

    START TRANSACTION;

    -- Clear existing sample payments (if any)
    DELETE FROM payments WHERE payment_id IN ('OS-001', 'OS-002', 'OS-003', 42, 37);

    -- =====================================================
    -- INSERT ONSITE PAYMENTS
    -- =====================================================
    
    -- Payment 1: Roberto Cruz
    INSERT INTO payments (
        payment_id,
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        branch_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        'OS-001',
        (SELECT stallholder_id FROM stallholder WHERE stallholder_name = 'Roberto Cruz' LIMIT 1),
        'onsite',
        5000.00,
        '2024-11-02',
        '14:30:00',
        '2024-11',
        'rental',
        'RCP-2024110201',
        'Admin Staff',
        'completed',
        'Monthly rental payment',
        1,
        1,
        '2024-11-02 14:30:00',
        '2024-11-02 14:30:00'
    );

    -- Payment 2: Maria Santos
    INSERT INTO payments (
        payment_id,
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        branch_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        'OS-002',
        (SELECT stallholder_id FROM stallholder WHERE stallholder_name = 'Maria Santos' LIMIT 1),
        'onsite',
        4500.00,
        '2024-11-01',
        '10:15:00',
        '2024-11',
        'rental',
        'RCP-2024110102',
        'Admin Staff',
        'completed',
        'Corner Market Area payment',
        1,
        1,
        '2024-11-01 10:15:00',
        '2024-11-01 10:15:00'
    );

    -- Payment 3: Carlos Mendoza
    INSERT INTO payments (
        payment_id,
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        branch_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        'OS-003',
        (SELECT stallholder_id FROM stallholder WHERE stallholder_name = 'Carlos Mendoza' LIMIT 1),
        'onsite',
        6000.00,
        '2024-10-31',
        '16:45:00',
        '2024-10',
        'rental',
        'RCP-2024103103',
        'Finance Officer',
        'completed',
        'Food Court Central payment',
        1,
        1,
        '2024-10-31 16:45:00',
        '2024-10-31 16:45:00'
    );

    -- =====================================================
    -- INSERT ONLINE PAYMENTS
    -- =====================================================
    
    -- Online Payment 1: Maria Santos
    INSERT INTO payments (
        payment_id,
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        branch_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        42,
        (SELECT stallholder_id FROM stallholder WHERE stallholder_name = 'Maria Santos' LIMIT 1),
        'bank_transfer',
        3500.00,
        '2025-11-13',
        '14:30:00',
        '2025-11',
        'rental',
        'BT-20251113-001',
        'System',
        'completed',
        'Bank transfer payment for stall rental',
        1,
        NULL,
        '2025-11-13 14:30:00',
        '2025-11-13 14:30:00'
    );

    -- Online Payment 2: Maria Santos
    INSERT INTO payments (
        payment_id,
        stallholder_id,
        payment_method,
        amount,
        payment_date,
        payment_time,
        payment_for_month,
        payment_type,
        reference_number,
        collected_by,
        payment_status,
        notes,
        branch_id,
        created_by,
        created_at,
        updated_at
    ) VALUES (
        37,
        (SELECT stallholder_id FROM stallholder WHERE stallholder_name = 'Maria Santos' LIMIT 1),
        'bank_transfer',
        3200.00,
        '2025-11-06',
        '10:15:00',
        '2025-11',
        'rental',
        'TXN-20251106-001',
        'System',
        'completed',
        'Monthly stall rental payment',
        1,
        NULL,
        '2025-11-06 10:15:00',
        '2025-11-06 10:15:00'
    );

    COMMIT;

    SELECT 'Sample payment data inserted successfully!' as message;

END$$

DELIMITER ;

-- =====================================================
-- 2. CREATE STORED PROCEDURE TO GET ONSITE PAYMENTS
-- =====================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `GetOnsitePayments`$$

CREATE PROCEDURE `GetOnsitePayments`(
    IN p_branch_id INT,
    IN p_search_query VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE sql_query TEXT;
    
    SET sql_query = '
        SELECT 
            p.payment_id as id,
            s.stallholder_name as stallholderName,
            st.stall_no as stallNo,
            p.amount,
            p.payment_date as paymentDate,
            p.collected_by as collectedBy,
            p.reference_number as receiptNo,
            p.notes,
            p.payment_status,
            p.created_at
        FROM payments p
        INNER JOIN stallholder s ON p.stallholder_id = s.stallholder_id
        INNER JOIN stall st ON s.stall_id = st.stall_id
        WHERE p.payment_method = ''onsite''
          AND (p.branch_id = ? OR p.branch_id IS NULL)
    ';
    
    -- Add search filter if provided
    IF p_search_query IS NOT NULL AND p_search_query != '' THEN
        SET sql_query = CONCAT(sql_query, '
            AND (
                p.payment_id LIKE CONCAT(''%'', ?, ''%'') OR
                s.stallholder_name LIKE CONCAT(''%'', ?, ''%'') OR
                st.stall_no LIKE CONCAT(''%'', ?, ''%'') OR
                p.reference_number LIKE CONCAT(''%'', ?, ''%'') OR
                p.collected_by LIKE CONCAT(''%'', ?, ''%'')
            )
        ');
    END IF;
    
    SET sql_query = CONCAT(sql_query, '
        ORDER BY p.payment_date DESC, p.payment_time DESC
    ');
    
    -- Add pagination if provided
    IF p_limit IS NOT NULL AND p_limit > 0 THEN
        SET sql_query = CONCAT(sql_query, ' LIMIT ', p_limit);
        IF p_offset IS NOT NULL AND p_offset > 0 THEN
            SET sql_query = CONCAT(sql_query, ' OFFSET ', p_offset);
        END IF;
    END IF;
    
    -- Execute the dynamic query
    SET @sql = sql_query;
    
    IF p_search_query IS NOT NULL AND p_search_query != '' THEN
        SET @branch_id = p_branch_id;
        SET @search1 = p_search_query;
        SET @search2 = p_search_query;
        SET @search3 = p_search_query;
        SET @search4 = p_search_query;
        SET @search5 = p_search_query;
        PREPARE stmt FROM @sql;
        EXECUTE stmt USING @branch_id, @search1, @search2, @search3, @search4, @search5;
        DEALLOCATE PREPARE stmt;
    ELSE
        SET @branch_id = p_branch_id;
        PREPARE stmt FROM @sql;
        EXECUTE stmt USING @branch_id;
        DEALLOCATE PREPARE stmt;
    END IF;
    
END$$

DELIMITER ;

-- =====================================================
-- 3. CREATE STORED PROCEDURE TO GET ONLINE PAYMENTS  
-- =====================================================
DELIMITER $$

DROP PROCEDURE IF EXISTS `GetOnlinePayments`$$

CREATE PROCEDURE `GetOnlinePayments`(
    IN p_branch_id INT,
    IN p_payment_method VARCHAR(50),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    SELECT 
        p.payment_id,
        s.stallholder_name,
        st.stall_no,
        p.payment_method,
        p.amount,
        p.payment_date,
        p.payment_time,
        p.reference_number,
        p.notes,
        p.payment_status,
        CASE 
            WHEN p.payment_method = 'online' AND p.notes LIKE '%GCash%' THEN 'GCash'
            WHEN p.payment_method = 'online' AND p.notes LIKE '%Maya%' THEN 'Maya'  
            WHEN p.payment_method = 'online' AND p.notes LIKE '%PayMaya%' THEN 'PayMaya'
            WHEN p.payment_method = 'bank_transfer' THEN 'Bank Transfer'
            ELSE p.payment_method
        END as specific_payment_method
    FROM payments p
    INNER JOIN stallholder s ON p.stallholder_id = s.stallholder_id
    INNER JOIN stall st ON s.stall_id = st.stall_id
    WHERE (p.branch_id = p_branch_id OR p.branch_id IS NULL)
      AND p.payment_method IN ('online', 'bank_transfer')
      AND (p_payment_method IS NULL OR p.payment_method = p_payment_method)
      AND (p_start_date IS NULL OR p.payment_date >= p_start_date)
      AND (p_end_date IS NULL OR p.payment_date <= p_end_date)
    ORDER BY p.payment_date DESC, p.payment_time DESC
    LIMIT IFNULL(p_limit, 20) OFFSET IFNULL(p_offset, 0);
    
END$$

DELIMITER ;

-- =====================================================
-- 4. RUN THE DATA INSERTION
-- =====================================================

-- Execute the procedure to insert sample data
CALL InsertSamplePayments();

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Verify onsite payments
SELECT 'ONSITE PAYMENTS:' as section;
CALL GetOnsitePayments(1, NULL, 10, 0);

-- Verify online payments  
SELECT 'ONLINE PAYMENTS:' as section;
CALL GetOnlinePayments(1, NULL, NULL, NULL, 10, 0);

-- Show payment counts
SELECT 
    payment_method,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM payments 
GROUP BY payment_method;

SELECT 'Payment data setup completed!' as status;