DROP PROCEDURE IF EXISTS `sp_getOnsitePaymentsByBranchesDecrypted`;

CREATE PROCEDURE `sp_getOnsitePaymentsByBranchesDecrypted`(
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
            ''', IFNULL(p_search, ''), ''' = '''' OR
            p.reference_number LIKE ''%', IFNULL(p_search, ''), '%'' OR
            sh.stallholder_name LIKE ''%', IFNULL(p_search, ''), '%'' OR
            st.stall_no LIKE ''%', IFNULL(p_search, ''), '%''
        )
        ORDER BY p.created_at DESC
        LIMIT ', p_limit, ' OFFSET ', p_offset
    );
    
    PREPARE stmt FROM @sql;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
END;
