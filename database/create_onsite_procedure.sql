-- =====================================================
-- Create Stored Procedure for Getting Onsite Payments
-- =====================================================

DROP PROCEDURE IF EXISTS GetOnsitePayments;

CREATE PROCEDURE GetOnsitePayments(
    IN p_branch_id INT,
    IN p_search VARCHAR(255),
    IN p_limit INT,
    IN p_offset INT
)
BEGIN
    DECLARE v_sql TEXT;
    
    SET v_sql = '
        SELECT 
            p.payment_id as id,
            s.stallholder_name as stallholderName,
            st.stall_no as stallNo,
            p.amount,
            p.payment_date as paymentDate,
            p.payment_time as paymentTime,
            p.collected_by as collectedBy,
            p.reference_number as receiptNo,
            p.notes,
            p.payment_status,
            p.created_at
        FROM payments p
        INNER JOIN stallholder s ON p.stallholder_id = s.stallholder_id
        INNER JOIN stall st ON s.stall_id = st.stall_id
        WHERE p.payment_method = ''onsite''
          AND (p.branch_id = ? OR p.branch_id IS NULL)';
    
    IF p_search IS NOT NULL AND p_search != '' THEN
        SET v_sql = CONCAT(v_sql, ' AND (
            p.payment_id LIKE ''%', p_search, '%'' OR
            s.stallholder_name LIKE ''%', p_search, '%'' OR
            st.stall_no LIKE ''%', p_search, '%'' OR
            p.reference_number LIKE ''%', p_search, '%'' OR
            p.collected_by LIKE ''%', p_search, '%''
        )');
    END IF;
    
    SET v_sql = CONCAT(v_sql, ' ORDER BY p.payment_date DESC, p.payment_time DESC LIMIT ', p_limit, ' OFFSET ', p_offset);
    
    SET @sql = v_sql;
    SET @branch_id = p_branch_id;
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt USING @branch_id;
    DEALLOCATE PREPARE stmt;
END;